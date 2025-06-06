import * as path from "path";
import * as fs from "fs";
import { spawn } from "child_process";
import { app } from "electron";
import {
  VideoInfo,
  FrameExtractionOptions,
  FrameExtractionResult,
} from "../types/ffmpeg.type";

// FFmpeg import with comprehensive error handling and fallback
let ffmpeg: any = null;
let ffmpegAvailable = false;
let ffmpegBinaryPath: string | null = null;
let ffprobeBinaryPath: string | null = null;

async function findFFmpegBinaries(): Promise<{
  ffmpeg: string | null;
  ffprobe: string | null;
}> {
  // Try to find binaries in PATH first
  for (const binary of ["ffmpeg", "ffprobe"]) {
    try {
      const result = await new Promise<string | null>((resolve) => {
        const which = spawn(process.platform === "win32" ? "where" : "which", [
          binary,
        ]);
        let output = "";

        which.stdout.on("data", (data) => {
          output += data.toString().trim();
        });

        which.on("close", (code) => {
          if (code === 0 && output) {
            resolve(output.split("\n")[0].trim());
          } else {
            resolve(null);
          }
        });

        which.on("error", () => resolve(null));
      });

      if (result) {
        if (binary === "ffmpeg") {
          return { ffmpeg: result, ffprobe: null };
        }
        if (binary === "ffprobe") {
          // If we found ffprobe, ffmpeg should be in the same directory
          const ffmpegPath = result.replace(/ffprobe(\.exe)?$/, "ffmpeg$1");
          return {
            ffmpeg: fs.existsSync(ffmpegPath) ? ffmpegPath : null,
            ffprobe: result,
          };
        }
      }
    } catch (error) {
      console.warn(`Failed to find ${binary} in PATH:`, error);
    }
  }

  // If not found in PATH, try common installation paths
  const commonPaths =
    process.platform === "win32"
      ? [
          "C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe",
          "C:\\ProgramData\\chocolatey\\bin\\ffprobe.exe",
          "C:\\ffmpeg\\bin\\ffmpeg.exe",
          "C:\\ffmpeg\\bin\\ffprobe.exe",
        ]
      : [
          "/usr/local/bin/ffmpeg",
          "/usr/local/bin/ffprobe",
          "/opt/homebrew/bin/ffmpeg",
          "/opt/homebrew/bin/ffprobe",
        ];

  let ffmpegPath: string | null = null;
  let ffprobePath: string | null = null;

  for (const testPath of commonPaths) {
    if (fs.existsSync(testPath)) {
      if (testPath.includes("ffmpeg")) {
        ffmpegPath = testPath;
        // Look for ffprobe in the same directory
        const probePath = testPath.replace(/ffmpeg(\.exe)?$/, "ffprobe$1");
        if (fs.existsSync(probePath)) {
          ffprobePath = probePath;
        }
      } else if (testPath.includes("ffprobe")) {
        ffprobePath = testPath;
        // Look for ffmpeg in the same directory
        const mpegPath = testPath.replace(/ffprobe(\.exe)?$/, "ffmpeg$1");
        if (fs.existsSync(mpegPath)) {
          ffmpegPath = mpegPath;
        }
      }

      // If we found both, break
      if (ffmpegPath && ffprobePath) {
        break;
      }
    }
  }

  return { ffmpeg: ffmpegPath, ffprobe: ffprobePath };
}

async function initializeFFmpeg(): Promise<void> {
  try {
    // First, try to find FFmpeg binaries
    const binaries = await findFFmpegBinaries();
    ffmpegBinaryPath = binaries.ffmpeg;
    ffprobeBinaryPath = binaries.ffprobe;

    console.log("FFmpeg binary search results:");
    console.log("  ffmpeg:", ffmpegBinaryPath || "not found");
    console.log("  ffprobe:", ffprobeBinaryPath || "not found");

    if (!ffmpegBinaryPath || !ffprobeBinaryPath) {
      console.warn(
        "FFmpeg binaries not found. Please ensure FFmpeg is installed and in PATH."
      );
      console.warn("Install via Chocolatey: choco install ffmpeg");
      console.warn("Or download from: https://ffmpeg.org/download.html");
    }

    // Try to load fluent-ffmpeg module
    let moduleFound = false;

    if (app.isPackaged) {
      try {
        const unpackedFFmpegPath = path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "fluent-ffmpeg"
        );

        if (fs.existsSync(unpackedFFmpegPath)) {
          ffmpeg = require(unpackedFFmpegPath);
          console.log("fluent-ffmpeg loaded from unpacked path");
          moduleFound = true;
        }
      } catch (unpackedError: unknown) {
        console.warn(
          "Failed to load from unpacked path:",
          unpackedError instanceof Error
            ? unpackedError.message
            : String(unpackedError)
        );
      }

      if (!moduleFound) {
        try {
          ffmpeg = require("fluent-ffmpeg");
          console.log("fluent-ffmpeg loaded from regular path");
          moduleFound = true;
        } catch (fallbackError: unknown) {
          console.warn(
            "Failed to load from regular path:",
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError)
          );
        }
      }
    } else {
      try {
        ffmpeg = require("fluent-ffmpeg");
        console.log("fluent-ffmpeg loaded in development");
        moduleFound = true;
      } catch (devError: unknown) {
        console.error(
          "fluent-ffmpeg not found in development. Run: npm install fluent-ffmpeg"
        );
        moduleFound = false;
      }
    }

    // Set binary paths if found
    if (moduleFound && ffmpeg) {
      if (ffmpegBinaryPath) {
        ffmpeg.setFfmpegPath(ffmpegBinaryPath);
        console.log("Set ffmpeg path:", ffmpegBinaryPath);
      }
      if (ffprobeBinaryPath) {
        ffmpeg.setFfprobePath(ffprobeBinaryPath);
        console.log("Set ffprobe path:", ffprobeBinaryPath);
      }
    }

    ffmpegAvailable =
      moduleFound && ffmpegBinaryPath !== null && ffprobeBinaryPath !== null;

    if (ffmpegAvailable) {
      console.log("✅ FFmpeg initialization successful");
    } else {
      console.warn(
        "⚠️ FFmpeg not fully available - video processing will be limited"
      );
      if (!ffmpegBinaryPath) console.warn("  - ffmpeg binary not found");
      if (!ffprobeBinaryPath) console.warn("  - ffprobe binary not found");
      if (!moduleFound) console.warn("  - fluent-ffmpeg module not loaded");
    }
  } catch (error: unknown) {
    console.error("Failed to initialize FFmpeg:", error);
    console.error("Video processing features will be disabled.");
    ffmpeg = null;
    ffmpegAvailable = false;
  }
}

// Initialize when module loads
initializeFFmpeg();

export class FFmpegManager {
  private ensureFFmpegAvailable(): void {
    if (!ffmpegAvailable || !ffmpeg || !ffprobeBinaryPath) {
      throw new Error(
        "FFmpeg is not available. Please install FFmpeg:\n" +
          "Via Chocolatey: choco install ffmpeg\n" +
          "Or download from: https://ffmpeg.org/download.html"
      );
    }
  }

  async reinitializeFFmpeg(): Promise<boolean> {
    await initializeFFmpeg();
    return ffmpegAvailable;
  }

  isFFmpegAvailable(): boolean {
    return ffmpegAvailable;
  }

  async getVideoInfo(videoPath: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      try {
        this.ensureFFmpegAvailable();

        if (!fs.existsSync(videoPath)) {
          throw new Error("Video file not found");
        }

        if (!ffprobeBinaryPath) {
          throw new Error("ffprobe binary not found");
        }

        const ffprobe = spawn(ffprobeBinaryPath, [
          "-v",
          "quiet",
          "-print_format",
          "json",
          "-show_format",
          "-show_streams",
          videoPath,
        ]);

        let output = "";
        let error = "";

        ffprobe.stdout.on("data", (data) => {
          output += data.toString();
        });

        ffprobe.stderr.on("data", (data) => {
          error += data.toString();
        });

        ffprobe.on("close", (code) => {
          if (code !== 0) {
            reject(new Error(`ffprobe failed (code ${code}): ${error}`));
            return;
          }

          try {
            const info = JSON.parse(output);
            const videoStream = info.streams.find(
              (s: any) => s.codec_type === "video"
            );

            if (!videoStream) {
              throw new Error("No video stream found");
            }

            resolve({
              duration: parseFloat(info.format.duration),
              width: videoStream.width,
              height: videoStream.height,
              fps: eval(videoStream.r_frame_rate), // Convert fraction to decimal
              codec: videoStream.codec_name,
            });
          } catch (parseError) {
            reject(new Error(`Failed to parse video info: ${parseError}`));
          }
        });

        ffprobe.on("error", (err) => {
          reject(new Error(`ffprobe error: ${err.message}`));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async extractFrames(
    videoPath: string,
    outputDir: string,
    options: FrameExtractionOptions = {}
  ): Promise<FrameExtractionResult> {
    return new Promise(async (resolve, reject) => {
      try {
        this.ensureFFmpegAvailable();

        if (!fs.existsSync(videoPath)) {
          throw new Error("Video file not found");
        }

        if (!ffmpegBinaryPath) {
          throw new Error("ffmpeg binary not found");
        }

        // Create output directory
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Get video info first
        const videoInfo = await this.getVideoInfo(videoPath);
        console.log("Video info:", videoInfo);

        const {
          startTime = 0,
          duration = Math.min(7, videoInfo.duration), // Max 7 seconds
          fps = 1.5, // Extract ~1.5 frames per second for 9-10 frames total
          width = 1920,
          height = 1080,
          format = "jpg",
          quality = 90,
        } = options;

        const outputPattern = path.join(outputDir, `frame_%04d.${format}`);

        const ffmpegArgs = [
          "-i",
          videoPath,
          "-ss",
          startTime.toString(),
          "-t",
          duration.toString(),
          "-vf",
          `fps=${fps},scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
          "-q:v",
          Math.round((100 - quality) / 10).toString(), // Convert quality to ffmpeg scale
          "-y", // Overwrite existing files
          outputPattern,
        ];

        console.log("FFmpeg command:", ffmpegBinaryPath, ffmpegArgs.join(" "));

        const ffmpegProcess = spawn(ffmpegBinaryPath, ffmpegArgs);

        let error = "";

        ffmpegProcess.stderr.on("data", (data) => {
          const errorStr = data.toString();
          error += errorStr;
          console.log("FFmpeg:", errorStr.trim());
        });

        ffmpegProcess.on("close", (code) => {
          if (code !== 0) {
            reject(new Error(`FFmpeg failed (code ${code}): ${error}`));
            return;
          }

          try {
            // Find all generated frame files
            const files = fs
              .readdirSync(outputDir)
              .filter(
                (file) =>
                  file.startsWith("frame_") && file.endsWith(`.${format}`)
              )
              .sort()
              .map((file) => path.join(outputDir, file));

            if (files.length === 0) {
              throw new Error("No frames were extracted from the video");
            }

            console.log(`Successfully extracted ${files.length} frames`);

            resolve({
              frames: files,
              totalFrames: files.length,
              videoInfo,
            });
          } catch (fsError) {
            reject(new Error(`Failed to read extracted frames: ${fsError}`));
          }
        });

        ffmpegProcess.on("error", (err) => {
          reject(new Error(`FFmpeg process error: ${err.message}`));
        });

        // Set timeout for frame extraction
        setTimeout(() => {
          if (!ffmpegProcess.killed) {
            ffmpegProcess.kill();
            reject(new Error("Frame extraction timed out"));
          }
        }, 30000); // 30 second timeout
      } catch (error) {
        reject(error);
      }
    });
  }

  async captureVideo(
    outputPath: string,
    duration: number = 7,
    options: any = {}
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        this.ensureFFmpegAvailable();

        // This would be implemented similar to camera capture
        // For now, we'll focus on processing existing videos
        reject(
          new Error(
            "Video capture via FFmpeg not implemented yet - use webcam capture"
          )
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // Cleanup temp directories
  async cleanupTempFrames(frameDir: string): Promise<void> {
    try {
      if (fs.existsSync(frameDir)) {
        const files = fs.readdirSync(frameDir);
        for (const file of files) {
          const filePath = path.join(frameDir, file);
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            console.warn(`Failed to delete frame file ${filePath}:`, error);
          }
        }
        // Check if directory is empty before attempting to remove
        if (fs.readdirSync(frameDir).length === 0) {
          fs.rmdirSync(frameDir);
          console.log(`Successfully cleaned up temp directory: ${frameDir}`);
        } else {
          console.warn(
            `Temp directory ${frameDir} not empty after attempting to delete files.`
          );
        }
      }
    } catch (error) {
      console.warn(
        `Failed to cleanup temp frames directory ${frameDir}:`,
        error
      );
    }
  }
}

export const ffmpegManager = new FFmpegManager();
