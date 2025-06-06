import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { app } from "electron";
import { sharpManager } from "./sharp";
import { ffmpegManager } from "./ffmpeg";
import { FlipbookOptions, FlipbookResult } from "../types/ffmpeg.type";

export class FlipbookManager {
  private getTempDir(): string {
    // Use consistent temp directory - prefer D:/tmp if it exists, otherwise use OS temp
    const customTempDir = "D:/tmp";
    if (fs.existsSync(customTempDir)) {
      return customTempDir;
    }
    return os.tmpdir();
  }

  async createFlipbook(
    videoPath: string,
    outputDirName: string,
    options: FlipbookOptions = {}
  ): Promise<FlipbookResult> {
    const baseDir = this.getTempDir();
    const sessionId = Date.now();

    // Create output directory in app's userData path for persistence
    const outputDir = path.join(
      app.getPath("userData"),
      "flipbooks",
      outputDirName
    );

    const tempRawFrameDir = path.join(
      baseDir,
      `flipbook_raw_frames_${sessionId}`
    );
    const tempFilteredFrameDir = path.join(
      baseDir,
      `flipbook_filtered_frames_${sessionId}`
    );

    try {
      console.log("Starting flipbook creation for:", videoPath);
      console.log("Output directory:", outputDir);
      console.log("Temp directories:", {
        tempRawFrameDir,
        tempFilteredFrameDir,
      });

      // Check if FFmpeg is available
      if (!ffmpegManager.isFFmpegAvailable()) {
        throw new Error(
          "FFmpeg is not available. Please install FFmpeg from https://ffmpeg.org/download.html and ensure it's in your system PATH."
        );
      }

      // Create all necessary directories
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      if (!fs.existsSync(tempRawFrameDir)) {
        fs.mkdirSync(tempRawFrameDir, { recursive: true });
      }
      if (!fs.existsSync(tempFilteredFrameDir)) {
        fs.mkdirSync(tempFilteredFrameDir, { recursive: true });
      }

      const {
        framesPerPage = 9,
        backgroundColor = "#ffffff",
        spacing = 15,
        aspectRatio = 16 / 9,
        logoSize = 200,
        filterName,
      } = options;

      // Step 1: Extract frames from video with higher frame rate
      let extractionResult;
      try {
        extractionResult = await ffmpegManager.extractFrames(
          videoPath,
          tempRawFrameDir,
          {
            duration: 7,
            fps: 8, // Increased from 1.5 to 8 fps for more frames
            width: 1920,
            height: 1080,
            format: "jpg",
            quality: 95,
          }
        );
        console.log(`Extracted ${extractionResult.totalFrames} raw frames.`);
      } catch (extractionError) {
        console.error("Frame extraction failed:", extractionError);
        throw new Error(
          `Failed to extract frames from video: ${
            extractionError instanceof Error
              ? extractionError.message
              : "Unknown error"
          }`
        );
      }

      // Step 2: Apply filter to each frame
      const filteredFramePaths: string[] = [];
      if (filterName && filterName !== "none") {
        for (const rawFramePath of extractionResult.frames) {
          const filteredFramePath = path.join(
            tempFilteredFrameDir,
            path.basename(rawFramePath)
          );
          const filterResult = await sharpManager.applyFilter(
            rawFramePath,
            filterName,
            filteredFramePath
          );
          if (filterResult.success && filterResult.outputPath) {
            filteredFramePaths.push(filterResult.outputPath);
          } else {
            console.warn(
              `Failed to apply filter to ${rawFramePath}. Using raw frame.`
            );
            fs.copyFileSync(rawFramePath, filteredFramePath);
            filteredFramePaths.push(filteredFramePath);
          }
        }
        console.log(
          `Applied filter '${filterName}' to ${filteredFramePaths.length} frames.`
        );
      } else {
        for (const rawFramePath of extractionResult.frames) {
          const targetPath = path.join(
            tempFilteredFrameDir,
            path.basename(rawFramePath)
          );
          fs.copyFileSync(rawFramePath, targetPath);
          filteredFramePaths.push(targetPath);
        }
        console.log("No filter applied, using raw frames.");
      }

      if (filteredFramePaths.length === 0) {
        throw new Error(
          "No frames available after extraction (and filtering)."
        );
      }

      // Step 3: Reverse the frame order (flipbook starts from end of video)
      const reversedFrames = [...filteredFramePaths].reverse();

      // Step 4: Calculate pages needed
      const totalFrames = reversedFrames.length;
      const pageCount = Math.ceil(totalFrames / framesPerPage);
      console.log(
        `Creating ${pageCount} pages with up to ${framesPerPage} frames each.`
      );

      // Step 5: Create pages
      const pageImagePaths: string[] = [];
      for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        const startFrame = pageIndex * framesPerPage;
        const endFrame = Math.min(startFrame + framesPerPage, totalFrames);
        const pageFrames = reversedFrames.slice(startFrame, endFrame);

        const pagePath = path.join(
          outputDir,
          `flipbook_page_${pageIndex + 1}.jpg`
        );
        await this.createFlipbookPageImage(pageFrames, pagePath, {
          backgroundColor,
          spacing,
          aspectRatio,
          logoSize,
          framesPerPage,
        });
        pageImagePaths.push(pagePath);
      }

      // Step 6: Create PDF from pages
      const pdfPath = path.join(outputDir, "flipbook_final.pdf");
      await this.createFlipbookPDFFromImages(pageImagePaths, pdfPath);

      console.log("Flipbook creation completed successfully.");

      return {
        pages: pageImagePaths,
        pdfPath,
        frameCount: totalFrames,
        pageCount,
      };
    } catch (error) {
      console.error("Flipbook creation failed:", error);

      if (error instanceof Error) {
        if (
          error.message.includes("ffprobe") ||
          error.message.includes("ffmpeg")
        ) {
          throw new Error(
            "FFmpeg is not installed or not found in system PATH. Please install FFmpeg from https://ffmpeg.org/download.html"
          );
        }
        throw error;
      }

      throw new Error(
        `Flipbook creation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Step 7: Cleanup temp frames with better error handling
      await this.safeCleanupTempFrames(tempRawFrameDir);
      await this.safeCleanupTempFrames(tempFilteredFrameDir);
    }
  }

  private async safeCleanupTempFrames(frameDir: string): Promise<void> {
    try {
      if (!fs.existsSync(frameDir)) {
        return;
      }

      console.log(`Cleaning up temp directory: ${frameDir}`);

      // First, try to delete files with retry logic
      const files = fs.readdirSync(frameDir);
      for (const file of files) {
        const filePath = path.join(frameDir, file);
        await this.deleteFileWithRetry(filePath, 3);
      }

      // Then try to remove the directory
      try {
        if (fs.readdirSync(frameDir).length === 0) {
          fs.rmdirSync(frameDir);
          console.log(`Successfully cleaned up temp directory: ${frameDir}`);
        } else {
          console.warn(`Temp directory ${frameDir} not empty after cleanup.`);
        }
      } catch (dirError) {
        console.warn(`Failed to remove temp directory ${frameDir}:`, dirError);
      }
    } catch (error) {
      console.warn(
        `Failed to cleanup temp frames directory ${frameDir}:`,
        error
      );
    }
  }

  private async deleteFileWithRetry(
    filePath: string,
    maxRetries: number
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        fs.unlinkSync(filePath);
        return; // Success
      } catch (error: any) {
        if (attempt === maxRetries) {
          console.warn(
            `Failed to delete ${filePath} after ${maxRetries} attempts:`,
            error.message
          );
          return;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }
    }
  }

  private async createFlipbookPageImage(
    frameImagePaths: string[],
    outputPath: string,
    options: {
      backgroundColor: string;
      spacing: number;
      aspectRatio: number;
      logoSize: number;
      framesPerPage: number;
    }
  ): Promise<void> {
    if (!sharpManager.isSharpAvailable()) {
      throw new Error("Sharp not available for flipbook page creation");
    }
    const sharp = require("sharp");

    const { backgroundColor, spacing, aspectRatio, logoSize, framesPerPage } =
      options;

    // A6 dimensions: 105mm x 148mm. At 300 DPI = 1240px x 1748px.
    // Using slightly smaller for safety: 1200x1700
    const canvasWidth = 1200;
    const canvasHeight = 1700;

    const logoSpaceHeight = logoSize > 0 ? logoSize + spacing * 2 : spacing;
    const availableHeight = canvasHeight - logoSpaceHeight - spacing; // Top margin
    const availableWidth = canvasWidth - spacing * 2; // Side margins

    const cols = Math.ceil(Math.sqrt(framesPerPage)); // e.g., 3 for 9 frames
    const rows = Math.ceil(framesPerPage / cols); // e.g., 3 for 9 frames

    let frameWidth = Math.floor((availableWidth - spacing * (cols - 1)) / cols);
    let frameHeight = Math.floor(frameWidth / aspectRatio);

    if (frameHeight * rows + spacing * (rows - 1) > availableHeight) {
      frameHeight = Math.floor((availableHeight - spacing * (rows - 1)) / rows);
      frameWidth = Math.floor(frameHeight * aspectRatio);
    }

    const resizedFrames = await Promise.all(
      frameImagePaths.map(async (framePath) =>
        sharp(framePath)
          .resize(frameWidth, frameHeight, { fit: "cover", position: "center" })
          .toBuffer()
      )
    );

    const totalGridWidth = frameWidth * cols + spacing * (cols - 1);
    const totalGridHeight = frameHeight * rows + spacing * (rows - 1);
    const startX = Math.floor((canvasWidth - totalGridWidth) / 2);
    const startY =
      spacing + Math.floor((availableHeight - totalGridHeight) / 2);

    const composites: any[] = [];
    resizedFrames.forEach((buffer, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      composites.push({
        input: buffer,
        left: startX + c * (frameWidth + spacing),
        top: startY + r * (frameHeight + spacing),
      });
    });

    // Add logo if path exists and size > 0
    const logoAssetPath = path.join(
      process.resourcesPath,
      "public",
      "logo",
      "logo.png"
    ); // Adjust as needed
    if (options.logoSize > 0 && fs.existsSync(logoAssetPath)) {
      try {
        const logoBuffer = await sharp(logoAssetPath)
          .resize(options.logoSize, options.logoSize, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
          })
          .png() // Ensure logo is PNG for transparency
          .toBuffer();

        const logoX = Math.floor((canvasWidth - options.logoSize) / 2);
        const logoY = canvasHeight - options.logoSize - spacing; // Place at bottom
        composites.push({
          input: logoBuffer,
          left: logoX,
          top: logoY,
        });
      } catch (logoError) {
        console.warn("Failed to add logo to flipbook page:", logoError);
      }
    }

    await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4, // Use 4 channels for RGBA if logo has transparency
        background: backgroundColor,
      },
    })
      .composite(composites)
      .jpeg({ quality: 95 })
      .toFile(outputPath);
    console.log(`Created flipbook page: ${outputPath}`);
  }

  private async createFlipbookPDFFromImages(
    pageImagePaths: string[],
    outputPath: string
  ): Promise<void> {
    if (!sharpManager.isPDFAvailable()) {
      // Relies on PDFKit being available via SharpManager's check
      console.warn(
        "PDFKit not available, skipping PDF generation for flipbook."
      );
      return;
    }
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({
      size: [1240, 1748], // A6 @ 300 DPI in points (approx) - or use standard 'A6' string
      // size: 'A6', // Standard A6 size
      margin: 0,
      layout: "portrait",
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    for (let i = 0; i < pageImagePaths.length; i++) {
      if (i > 0) doc.addPage();
      const pagePath = pageImagePaths[i];
      if (fs.existsSync(pagePath)) {
        // Fit image to page, maintaining aspect ratio
        doc.image(pagePath, 0, 0, {
          fit: [doc.page.width, doc.page.height],
          align: "center",
          valign: "center",
        });
      }
    }
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => {
        console.log(`Created flipbook PDF: ${outputPath}`);
        resolve();
      });
      stream.on("error", reject);
    });
  }
}

export const flipbookManager = new FlipbookManager();
