import * as path from "path";
import * as fs from "fs";
import { app } from "electron";

// Sharp import with comprehensive error handling and fallback
let sharp: any = null;
let sharpAvailable = false;

// PDFKit import with error handling
let PDFDocument: any = null;
let pdfAvailable = false;

async function initializeSharp(): Promise<void> {
  try {
    // Try to load Sharp
    if (app.isPackaged) {
      // In production, try from unpacked location first
      try {
        const unpackedSharpPath = path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "sharp"
        );
        sharp = require(unpackedSharpPath);
        console.log("Sharp loaded from unpacked path");
      } catch {
        // Fallback to regular require
        sharp = require("sharp");
        console.log("Sharp loaded from regular path");
      }
    } else {
      sharp = require("sharp");
      console.log("Sharp loaded in development");
    }

    // Test Sharp functionality
    await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    sharpAvailable = true;
    console.log("Sharp initialization successful");
  } catch (error) {
    console.error("Failed to initialize Sharp:", error);
    sharp = null;
    sharpAvailable = false;
  }
}

async function initializePDFKit(): Promise<void> {
  try {
    // Try to load PDFKit
    if (app.isPackaged) {
      try {
        const unpackedPDFPath = path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "pdfkit"
        );
        PDFDocument = require(unpackedPDFPath);
        console.log("PDFKit loaded from unpacked path");
      } catch {
        PDFDocument = require("pdfkit");
        console.log("PDFKit loaded from regular path");
      }
    } else {
      PDFDocument = require("pdfkit");
      console.log("PDFKit loaded in development");
    }

    pdfAvailable = true;
    console.log("PDFKit initialization successful");
  } catch (error) {
    console.error("Failed to initialize PDFKit:", error);
    PDFDocument = null;
    pdfAvailable = false;
  }
}

// Initialize modules when this file loads
Promise.all([initializeSharp(), initializePDFKit()]);

import { sharpPresets } from "../presets/sharp.preset";
import {
  SharpFilterOptions,
  CollageOptions,
  CollageResult,
  FilterResult,
  AvailableFilter,
} from "../types/sharp.type";

export class SharpManager {
  private ensureSharpAvailable(): void {
    if (!sharpAvailable || !sharp) {
      throw new Error(
        "Sharp module is not available. Image processing features are disabled."
      );
    }
  }

  private ensurePDFAvailable(): void {
    if (!pdfAvailable || !PDFDocument) {
      throw new Error(
        "PDFKit module is not available. PDF generation features are disabled."
      );
    }
  }

  async reinitializeSharp(): Promise<boolean> {
    await initializeSharp();
    await initializePDFKit();
    return sharpAvailable;
  }

  isSharpAvailable(): boolean {
    return sharpAvailable;
  }

  isPDFAvailable(): boolean {
    return pdfAvailable;
  }

  async applyFilter(
    inputPath: string,
    filterName: string,
    outputPath: string
  ): Promise<FilterResult> {
    try {
      this.ensureSharpAvailable();

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

      // Apply gamma correction with validation
      if (preset.gamma) {
        const validGamma = Math.max(1.0, Math.min(3.0, preset.gamma));
        pipeline = pipeline.gamma(validGamma);
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
      this.ensureSharpAvailable();

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

      // Apply gamma correction with validation
      if (options.gamma) {
        const validGamma = Math.max(1.0, Math.min(3.0, options.gamma));
        pipeline = pipeline.gamma(validGamma);
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

  private async createPDFFromImage(
    imagePath: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ensureSharpAvailable();
        this.ensurePDFAvailable();

        const doc = new PDFDocument({
          size: [297.64, 419.53], // A6 size in points (4.15" x 5.83")
          margin: 0,
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Get image dimensions
        sharp(imagePath)
          .metadata()
          .then((metadata: any) => {
            const imageWidth = metadata.width || 0;
            const imageHeight = metadata.height || 0;

            // Calculate scaling to fit A6 page
            const pageWidth = 297.64;
            const pageHeight = 419.53;

            const scaleX = pageWidth / imageWidth;
            const scaleY = pageHeight / imageHeight;
            const scale = Math.min(scaleX, scaleY);

            const scaledWidth = imageWidth * scale;
            const scaledHeight = imageHeight * scale;

            const x = (pageWidth - scaledWidth) / 2;
            const y = (pageHeight - scaledHeight) / 2;

            doc.image(imagePath, x, y, {
              width: scaledWidth,
              height: scaledHeight,
            });

            doc.end();
          })
          .catch(reject);

        stream.on("finish", resolve);
        stream.on("error", reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async buildCollage(
    imagePaths: string[],
    outputPath: string,
    options: CollageOptions = {}
  ): Promise<CollageResult> {
    try {
      this.ensureSharpAvailable();

      // Validate input images
      for (const imagePath of imagePaths) {
        if (!fs.existsSync(imagePath)) {
          throw new Error(`Image not found: ${imagePath}`);
        }
      }

      // Handle different paper types with correct image counts
      const is2x6Layout = options.paperType === "2x6";
      const expectedImageCount = is2x6Layout ? 2 : 4; // 2x6 needs 2 unique images, 4x6 needs 4

      if (imagePaths.length !== expectedImageCount) {
        throw new Error(
          `Expected ${expectedImageCount} images for ${
            options.paperType || "4x6"
          } layout, got ${imagePaths.length}`
        );
      }

      const {
        spacing = 10,
        backgroundColor = "#ffffff",
        logoPath,
        logoPosition = "bottom-center",
        logoSize = 60,
      } = options;

      // A6 dimensions: 105mm x 148mm at 300 DPI = 1240px x 1748px
      const canvasWidth = 1200;
      const canvasHeight = 1700;

      let photoWidth: number;
      let photoHeight: number;
      let composition: any[];

      if (is2x6Layout) {
        // For 2x6: 2 photos arranged vertically on left, then mirrored on right
        // Layout: [Photo1] [Photo1]
        //        [Photo2] [Photo2]
        const availableWidth = (canvasWidth - spacing * 3) / 2;
        const availableHeight = (canvasHeight - spacing * 3 - logoSize) / 2;

        // For 2x6, photos should be more vertical (portrait orientation)
        const targetAspectRatio = 2 / 3; // Height to width ratio (more vertical)

        if (availableWidth / availableHeight > targetAspectRatio) {
          photoHeight = availableHeight;
          photoWidth = photoHeight * targetAspectRatio;
        } else {
          photoWidth = availableWidth;
          photoHeight = photoWidth / targetAspectRatio;
        }

        photoWidth = Math.floor(photoWidth);
        photoHeight = Math.floor(photoHeight);

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

        const gridWidth = photoWidth * 2 + spacing;
        const gridHeight = photoHeight * 2 + spacing;
        const startX = Math.floor((canvasWidth - gridWidth) / 2);
        const startY = Math.floor((canvasHeight - gridHeight - logoSize) / 2);

        composition = [
          // Left column: Photo1 top, Photo2 bottom
          { input: resizedImages[0], left: startX, top: startY },
          {
            input: resizedImages[1],
            left: startX,
            top: startY + photoHeight + spacing,
          },
          // Right column: Photo1 top, Photo2 bottom (mirrored)
          {
            input: resizedImages[0],
            left: startX + photoWidth + spacing,
            top: startY,
          },
          {
            input: resizedImages[1],
            left: startX + photoWidth + spacing,
            top: startY + photoHeight + spacing,
          },
        ];
      } else {
        // For 4x6: 2x2 grid of 4 different photos
        const availableWidth = (canvasWidth - spacing * 3) / 2;
        const availableHeight = (canvasHeight - spacing * 4 - logoSize) / 2;

        const targetAspectRatio = 3 / 2;

        if (availableWidth / availableHeight > targetAspectRatio) {
          photoHeight = availableHeight;
          photoWidth = photoHeight * targetAspectRatio;
        } else {
          photoWidth = availableWidth;
          photoHeight = photoWidth / targetAspectRatio;
        }

        photoWidth = Math.floor(photoWidth);
        photoHeight = Math.floor(photoHeight);

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

        const gridWidth = photoWidth * 2 + spacing;
        const gridHeight = photoHeight * 2 + spacing;
        const startX = Math.floor((canvasWidth - gridWidth) / 2);
        const startY = Math.floor((canvasHeight - gridHeight - logoSize) / 2);

        composition = [
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
      }

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

      // Generate PDF using custom implementation - only if PDFKit is available
      let pdfPath = "";
      if (pdfAvailable) {
        try {
          pdfPath = outputPath.replace(/\.[^/.]+$/, ".pdf");
          await this.createPDFFromImage(jpegPath, pdfPath);
        } catch (pdfError) {
          console.warn("PDF generation failed:", pdfError);
          pdfPath = "";
        }
      } else {
        console.warn("PDFKit not available, skipping PDF generation");
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

  async generatePrintPDF(
    imagePaths: string[],
    outputPath: string,
    options: any = {}
  ): Promise<CollageResult> {
    // Use the existing buildCollage method but ensure PDF output
    return await this.buildCollage(imagePaths, outputPath, {
      ...options,
      paperSize: "A6",
      orientation: "portrait",
    });
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
