import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { sharpPresets, FilterPreset } from "../presets/sharp.preset";
import {
  SharpFilterOptions,
  CollageOptions,
  CollageResult,
  FilterResult,
  AvailableFilter,
} from "../types/sharp.type";

// Import image-to-pdf with error handling
let imageToPdf: any = null;
try {
  imageToPdf = require("image-to-pdf");
} catch (error) {
  console.warn("image-to-pdf not available, PDF generation will be disabled");
}

export class SharpManager {
  async applyFilter(
    inputPath: string,
    filterName: string,
    outputPath: string
  ): Promise<FilterResult> {
    try {
      if (!fs.existsSync(inputPath)) {
        throw new Error("Input image file not found");
      }

      const preset = sharpPresets[filterName];
      if (!preset) {
        throw new Error(`Filter "${filterName}" not found`);
      }

      let pipeline = sharp(inputPath);

      // Apply grayscale first if needed
      if (preset.grayscale) {
        pipeline = pipeline.grayscale();
      }

      // Apply modulation
      if (preset.modulate) {
        pipeline = pipeline.modulate(preset.modulate);
      }

      // Apply tint
      if (preset.tint) {
        pipeline = pipeline.tint(preset.tint);
      }

      // Apply gamma correction
      if (preset.gamma) {
        pipeline = pipeline.gamma(preset.gamma);
      }

      // Apply linear transformation
      if (preset.linear) {
        pipeline = pipeline.linear(
          preset.linear.multiplier,
          preset.linear.offset
        );
      }

      // Apply blur
      if (preset.blur && preset.blur > 0) {
        pipeline = pipeline.blur(preset.blur);
      }

      await pipeline.jpeg({ quality: 90 }).toFile(outputPath);

      return {
        success: true,
        outputPath,
      };
    } catch (error) {
      console.error("Filter application failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async applyCustomFilter(
    inputPath: string,
    options: SharpFilterOptions,
    outputPath: string
  ): Promise<FilterResult> {
    try {
      if (!fs.existsSync(inputPath)) {
        throw new Error("Input image file not found");
      }

      let pipeline = sharp(inputPath);

      // Apply grayscale first if needed
      if (options.grayscale) {
        pipeline = pipeline.grayscale();
      }

      // Apply modulation
      const modulation: any = {};
      if (options.brightness !== undefined)
        modulation.brightness = options.brightness;
      if (options.saturation !== undefined)
        modulation.saturation = options.saturation;
      if (options.hue !== undefined) modulation.hue = options.hue;

      if (Object.keys(modulation).length > 0) {
        pipeline = pipeline.modulate(modulation);
      }

      // Apply tint
      if (options.tint) {
        pipeline = pipeline.tint(options.tint);
      }

      // Apply gamma correction
      if (options.gamma) {
        pipeline = pipeline.gamma(options.gamma);
      }

      // Apply contrast (using linear transformation)
      if (options.contrast) {
        pipeline = pipeline.linear(options.contrast, 0);
      }

      // Apply blur
      if (options.blur && options.blur > 0) {
        pipeline = pipeline.blur(options.blur);
      }

      await pipeline.jpeg({ quality: 90 }).toFile(outputPath);

      return {
        success: true,
        outputPath,
      };
    } catch (error) {
      console.error("Custom filter application failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async buildCollage(
    imagePaths: string[],
    outputPath: string,
    options: CollageOptions = {}
  ): Promise<CollageResult> {
    try {
      // Validate input images
      for (const imagePath of imagePaths) {
        if (!fs.existsSync(imagePath)) {
          throw new Error(`Image not found: ${imagePath}`);
        }
      }

      if (imagePaths.length !== 4) {
        throw new Error("Exactly 4 images are required for collage");
      }

      const {
        spacing = 10,
        backgroundColor = "#ffffff",
        logoPath,
        logoPosition = "bottom-center",
        logoSize = 60,
      } = options;

      // A6 dimensions: 105mm x 148mm at 300 DPI = 1240px x 1748px
      // We'll use a slightly smaller canvas to ensure proper margins
      const canvasWidth = 1200; // A6 width with margins
      const canvasHeight = 1700; // A6 height with margins

      // Calculate photo dimensions for 2x2 grid
      // Each photo should be landscape (3:2 aspect ratio) fitting in available space
      const availableWidth = (canvasWidth - spacing * 3) / 2; // 2 photos per row, 3 spacing gaps
      const availableHeight = (canvasHeight - spacing * 4 - logoSize) / 2; // 2 rows, 4 spacing gaps, logo space

      // For landscape photos (3:2 aspect ratio), determine size based on available space
      let photoWidth: number;
      let photoHeight: number;

      const targetAspectRatio = 3 / 2; // Landscape DSLR ratio

      if (availableWidth / availableHeight > targetAspectRatio) {
        // Height is the limiting factor
        photoHeight = availableHeight;
        photoWidth = photoHeight * targetAspectRatio;
      } else {
        // Width is the limiting factor
        photoWidth = availableWidth;
        photoHeight = photoWidth / targetAspectRatio;
      }

      // Ensure dimensions are integers
      photoWidth = Math.floor(photoWidth);
      photoHeight = Math.floor(photoHeight);

      // Resize all images to uniform landscape rectangles with proper aspect ratio
      const resizedImages = await Promise.all(
        imagePaths.map(async (imgPath) => {
          return await sharp(imgPath)
            .resize(photoWidth, photoHeight, {
              fit: "cover",
              position: "center",
            })
            .toBuffer();
        })
      );

      // Calculate positions for 2x2 grid, centered on canvas
      const gridWidth = photoWidth * 2 + spacing;
      const gridHeight = photoHeight * 2 + spacing;
      const startX = Math.floor((canvasWidth - gridWidth) / 2);
      const startY = Math.floor((canvasHeight - gridHeight - logoSize) / 2);

      // Create collage composition array
      const composition = [
        { input: resizedImages[0], left: startX, top: startY },
        {
          input: resizedImages[1],
          left: startX + photoWidth + spacing,
          top: startY,
        },
        {
          input: resizedImages[2],
          left: startX,
          top: startY + photoHeight + spacing,
        },
        {
          input: resizedImages[3],
          left: startX + photoWidth + spacing,
          top: startY + photoHeight + spacing,
        },
      ];

      // Add logo if provided
      if (logoPath && fs.existsSync(logoPath)) {
        const logoBuffer = await sharp(logoPath)
          .resize(logoSize, logoSize, { fit: "contain" })
          .toBuffer();

        let logoLeft: number;
        let logoTop: number;

        switch (logoPosition) {
          case "bottom-center":
            logoLeft = Math.floor((canvasWidth - logoSize) / 2);
            logoTop = canvasHeight - logoSize - spacing;
            break;
          case "bottom-left":
            logoLeft = spacing;
            logoTop = canvasHeight - logoSize - spacing;
            break;
          case "bottom-right":
            logoLeft = canvasWidth - logoSize - spacing;
            logoTop = canvasHeight - logoSize - spacing;
            break;
          case "top-center":
            logoLeft = Math.floor((canvasWidth - logoSize) / 2);
            logoTop = spacing;
            break;
          default:
            logoLeft = Math.floor((canvasWidth - logoSize) / 2);
            logoTop = canvasHeight - logoSize - spacing;
        }

        composition.push({
          input: logoBuffer,
          left: logoLeft,
          top: logoTop,
        });
      }

      // Build the collage with A6 dimensions
      const collage = sharp({
        create: {
          width: canvasWidth,
          height: canvasHeight,
          channels: 3,
          background: backgroundColor,
        },
      });

      // Generate JPEG output path
      const jpegPath = outputPath.replace(/\.[^/.]+$/, ".jpg");

      await collage
        .composite(composition)
        .jpeg({ quality: 95 })
        .toFile(jpegPath);

      // Generate PDF if image-to-pdf is available
      let pdfPath = "";
      if (imageToPdf) {
        pdfPath = outputPath.replace(/\.[^/.]+$/, ".pdf");

        try {
          const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
            imageToPdf(
              [jpegPath],
              {
                size: "A6",
                orientation: "portrait",
              },
              (err: any, buffer: Buffer) => {
                if (err) reject(err);
                else resolve(buffer);
              }
            );
          });

          fs.writeFileSync(pdfPath, pdfBuffer);
        } catch (pdfError) {
          console.warn("PDF generation failed:", pdfError);
          pdfPath = "";
        }
      }

      return {
        jpegPath,
        pdfPath,
      };
    } catch (error) {
      console.error("Collage building failed:", error);
      throw new Error(
        `Collage building failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  getAvailableFilters(): AvailableFilter[] {
    return Object.keys(sharpPresets).map((key) => ({
      key,
      name: sharpPresets[key].name,
      description: sharpPresets[key].description,
    }));
  }

  getFilterInfo(filterName: string): AvailableFilter | null {
    const preset = sharpPresets[filterName];
    if (!preset) {
      return null;
    }
    return {
      key: filterName,
      name: preset.name,
      description: preset.description,
    };
  }
}

export const sharpManager = new SharpManager();
