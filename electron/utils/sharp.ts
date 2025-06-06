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
    // Try to load Sharp with better path resolution for packaged apps
    if (app.isPackaged) {
      // Multiple fallback paths for packaged apps
      const possibleSharpPaths = [
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "sharp"
        ),
        path.join(process.resourcesPath, "node_modules", "sharp"),
        path.join(__dirname, "..", "..", "node_modules", "sharp"),
        path.join(process.cwd(), "node_modules", "sharp"),
      ];

      let sharpLoaded = false;

      for (const sharpPath of possibleSharpPaths) {
        try {
          console.log(`Trying to load Sharp from: ${sharpPath}`);
          if (fs.existsSync(sharpPath)) {
            sharp = require(sharpPath);
            console.log(`Sharp loaded successfully from: ${sharpPath}`);
            sharpLoaded = true;
            break;
          }
        } catch (pathError: unknown) {
          console.warn(
            `Failed to load Sharp from ${sharpPath}:`,
            pathError instanceof Error ? pathError.message : String(pathError)
          );
        }
      }

      if (!sharpLoaded) {
        // Final fallback to regular require
        sharp = require("sharp");
        console.log("Sharp loaded from regular require as fallback");
      }
    } else {
      sharp = require("sharp");
      console.log("Sharp loaded in development");
    }

    // Test Sharp functionality with more comprehensive test
    const testBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    if (testBuffer && testBuffer.length > 0) {
      sharpAvailable = true;
      console.log("✅ Sharp initialization and functionality test successful");
    } else {
      throw new Error("Sharp test produced empty buffer");
    }
  } catch (error) {
    console.error("❌ Failed to initialize Sharp:", error);
    console.error("Image processing features will be disabled");
    sharp = null;
    sharpAvailable = false;
  }
}

async function initializePDFKit(): Promise<void> {
  try {
    // Try to load PDFKit with better path resolution
    if (app.isPackaged) {
      const possiblePDFPaths = [
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "pdfkit"
        ),
        path.join(process.resourcesPath, "node_modules", "pdfkit"),
        path.join(__dirname, "..", "..", "node_modules", "pdfkit"),
        path.join(process.cwd(), "node_modules", "pdfkit"),
      ];

      let pdfLoaded = false;

      for (const pdfPath of possiblePDFPaths) {
        try {
          console.log(`Trying to load PDFKit from: ${pdfPath}`);
          if (fs.existsSync(pdfPath)) {
            PDFDocument = require(pdfPath);
            console.log(`PDFKit loaded successfully from: ${pdfPath}`);
            pdfLoaded = true;
            break;
          }
        } catch (pathError: unknown) {
          console.warn(
            `Failed to load PDFKit from ${pdfPath}:`,
            pathError instanceof Error ? pathError.message : String(pathError)
          );
        }
      }

      if (!pdfLoaded) {
        PDFDocument = require("pdfkit");
        console.log("PDFKit loaded from regular require as fallback");
      }
    } else {
      PDFDocument = require("pdfkit");
      console.log("PDFKit loaded in development");
    }

    // Test PDFKit functionality
    const testDoc = new PDFDocument();
    if (testDoc && typeof testDoc.pipe === "function") {
      pdfAvailable = true;
      console.log("✅ PDFKit initialization and functionality test successful");
    } else {
      throw new Error("PDFKit test failed - invalid document object");
    }
  } catch (error) {
    console.error("❌ Failed to initialize PDFKit:", error);
    console.error("PDF generation features will be disabled");
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
        spacing = 20, // Further reduced horizontal spacing from 40 to 20
        backgroundColor = "#ffffff",
        logoSize = 360, // Keep the large logo size
      } = options;

      // Keep vertical spacing separate from logo positioning
      const verticalSpacing = Math.floor(spacing * 10); // 600px when spacing is 20px (increased for better separation)

      // A6 dimensions: 105mm x 148mm at 300 DPI = 1240px x 1748px
      const canvasWidth = 1200;
      const canvasHeight = 1700;

      // Resolve logo path - check multiple possible locations
      let logoPath = "";
      const possibleLogoPaths = [
        path.join(process.resourcesPath, "app", "public", "logo", "logo.png"),
        path.join(process.resourcesPath, "public", "logo", "logo.png"),
        path.join(__dirname, "..", "..", "public", "logo", "logo.png"),
        path.join(__dirname, "..", "..", "..", "public", "logo", "logo.png"),
        path.join(process.cwd(), "public", "logo", "logo.png"),
      ];

      for (const possiblePath of possibleLogoPaths) {
        if (fs.existsSync(possiblePath)) {
          logoPath = possiblePath;
          console.log("Logo found at:", logoPath);
          break;
        }
      }

      if (!logoPath) {
        console.warn(
          "Logo not found at any expected location. Proceeding without logo."
        );
      }

      let photoWidth: number;
      let photoHeight: number;
      let composition: any[];

      // Reserve fixed space for logo at bottom - don't let vertical spacing affect this
      const logoSpaceHeight = logoPath ? logoSize + 20 : 20; // Reduced from 40 to 20
      const availableCanvasHeight = canvasHeight - logoSpaceHeight;

      if (is2x6Layout) {
        // For 2x6: 2 photos arranged vertically on left, then mirrored on right
        // Split canvas into two halves with horizontal spacing in between
        const halfCanvasWidth = Math.floor((canvasWidth - spacing) / 2); // Split with spacing in middle

        // Each half gets its own photo column with minimal margins
        const photoColumnWidth = halfCanvasWidth - spacing / 2; // Reduced margin for each column
        const photoColumnHeight = availableCanvasHeight - 60; // Fixed top and bottom margins

        // Calculate photo dimensions with 3:4 aspect ratio, making them larger
        const targetAspectRatio = 3 / 4; // width/height

        // Calculate max photo height considering the vertical spacing between photos
        const maxPhotoHeight = (photoColumnHeight - verticalSpacing) / 2; // Two photos with gap between

        // Make photos even bigger - use full available space
        photoWidth = Math.min(
          photoColumnWidth, // Use full column width
          maxPhotoHeight * targetAspectRatio
        );
        photoHeight = photoWidth / targetAspectRatio;

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

        // Calculate positions for left and right columns - ensure integers
        const leftColumnX = Math.floor(
          spacing / 4 + (halfCanvasWidth - photoWidth) / 2
        );
        const rightColumnX = Math.floor(
          halfCanvasWidth + spacing / 4 + (halfCanvasWidth - photoWidth) / 2
        );

        // Start photos from top with proper margin - don't position too close to top
        const topMargin = 80; // Increased top margin to move photos away from top border
        const totalPhotoHeight = photoHeight * 2 + verticalSpacing;
        const startY = Math.floor(topMargin);

        composition = [
          // Left column: Photo1 top, Photo2 bottom
          { input: resizedImages[0], left: leftColumnX, top: startY },
          {
            input: resizedImages[1],
            left: leftColumnX,
            top: startY + photoHeight + verticalSpacing, // Add proper vertical spacing
          },
          // Right column: Photo1 top, Photo2 bottom (mirrored)
          {
            input: resizedImages[0],
            left: rightColumnX,
            top: startY,
          },
          {
            input: resizedImages[1],
            left: rightColumnX,
            top: startY + photoHeight + verticalSpacing, // Add proper vertical spacing
          },
        ];

        // Add TWO logos for 2x6 layout - one under each column (independent of vertical spacing)
        if (logoPath && fs.existsSync(logoPath)) {
          try {
            const logoBuffer = await sharp(logoPath)
              .resize(logoSize, logoSize, {
                fit: "contain",
                background: { r: 255, g: 255, b: 255, alpha: 0 },
              })
              .toBuffer();

            // Left logo position - ensure integers, fixed distance from bottom
            const leftLogoX = Math.floor(
              spacing / 4 + (halfCanvasWidth - logoSize) / 2
            );
            const logoY = Math.floor(canvasHeight - logoSize - 10); // Reduced from 20 to 10

            // Right logo position - ensure integers
            const rightLogoX = Math.floor(
              halfCanvasWidth + spacing / 4 + (halfCanvasWidth - logoSize) / 2
            );

            composition.push(
              {
                input: logoBuffer,
                left: leftLogoX,
                top: logoY,
              },
              {
                input: logoBuffer,
                left: rightLogoX,
                top: logoY,
              }
            );

            console.log(
              `Two logos added to 2x6 collage at positions: (${leftLogoX}, ${logoY}) and (${rightLogoX}, ${logoY}) with size: ${logoSize}px`
            );
          } catch (logoError) {
            console.warn("Failed to process logo:", logoError);
          }
        }
      } else {
        // For 4x6: 2x2 grid arranged in columns like 2x6 layout
        // Split canvas into two halves with horizontal spacing in between
        const halfCanvasWidth = Math.floor((canvasWidth - spacing) / 2); // Split with spacing in middle

        // Each half gets its own photo column with minimal margins
        const photoColumnWidth = halfCanvasWidth - spacing / 2; // Reduced margin for each column
        const photoColumnHeight = availableCanvasHeight - 60; // Fixed top and bottom margins

        // Calculate photo dimensions with 3:4 aspect ratio, making them larger
        const targetAspectRatio = 3 / 4; // width/height

        // Calculate max photo height considering the vertical spacing between photos
        const maxPhotoHeight = (photoColumnHeight - verticalSpacing) / 2; // Two photos with gap between

        // Make photos even bigger - use full available space
        photoWidth = Math.min(
          photoColumnWidth, // Use full column width
          maxPhotoHeight * targetAspectRatio
        );
        photoHeight = photoWidth / targetAspectRatio;

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

        // Calculate positions for left and right columns - ensure integers
        const leftColumnX = Math.floor(
          spacing / 4 + (halfCanvasWidth - photoWidth) / 2
        );
        const rightColumnX = Math.floor(
          halfCanvasWidth + spacing / 4 + (halfCanvasWidth - photoWidth) / 2
        );

        // Start photos from top with proper margin - don't position too close to top
        const topMargin = 80; // Increased top margin to move photos away from top border
        const startY = Math.floor(topMargin);

        composition = [
          // Left column: Photo1 top, Photo2 bottom
          { input: resizedImages[0], left: leftColumnX, top: startY },
          {
            input: resizedImages[1],
            left: leftColumnX,
            top: startY + photoHeight + verticalSpacing, // Add proper vertical spacing
          },
          // Right column: Photo3 top, Photo4 bottom
          {
            input: resizedImages[2],
            left: rightColumnX,
            top: startY,
          },
          {
            input: resizedImages[3],
            left: rightColumnX,
            top: startY + photoHeight + verticalSpacing, // Add proper vertical spacing
          },
        ];

        // Add single centered logo for 4x6 layout (independent of vertical spacing)
        if (logoPath && fs.existsSync(logoPath)) {
          try {
            const logoBuffer = await sharp(logoPath)
              .resize(logoSize, logoSize, {
                fit: "contain",
                background: { r: 255, g: 255, b: 255, alpha: 0 },
              })
              .toBuffer();

            const logoLeft = Math.floor((canvasWidth - logoSize) / 2);
            const logoTop = Math.floor(canvasHeight - logoSize - 10); // Reduced from 20 to 10

            composition.push({
              input: logoBuffer,
              left: logoLeft,
              top: logoTop,
            });

            console.log(
              `Logo added to 4x6 collage at position: ${logoLeft}, ${logoTop} with size: ${logoSize}px`
            );
          } catch (logoError) {
            console.warn("Failed to process logo:", logoError);
          }
        }
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
