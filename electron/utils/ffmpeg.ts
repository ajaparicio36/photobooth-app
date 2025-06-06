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

async function testBinaryPath(binaryPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const testProcess = spawn(binaryPath, ["-version"], {
      stdio: "pipe",
      windowsHide: true,
    });

    let hasOutput = false;

    testProcess.stdout.on("data", (data) => {
      const output = data.toString().toLowerCase();
      if (output.includes("ffmpeg") || output.includes("ffprobe")) {
        hasOutput = true;
      }
    });

    testProcess.on("close", (code) => {
      resolve(hasOutput && code === 0);
    });

    testProcess.on("error", () => {
      resolve(false);
    });

    // Timeout after 3 seconds
    setTimeout(() => {
      if (!testProcess.killed) {
        testProcess.kill();
        resolve(false);
      }
    }, 3000);
  });
}

async function findFFmpegBinaries(): Promise<{
  ffmpeg: string | null;
  ffprobe: string | null;
}> {
  console.log("🔍 Searching for FFmpeg binaries...");

  // Try to find binaries in PATH first using 'where' on Windows
  const searchCommands =
    process.platform === "win32"
      ? [
          ["where", "ffmpeg"],
          ["where", "ffprobe"],
        ]
      : [
          ["which", "ffmpeg"],
          ["which", "ffprobe"],
        ];

  let ffmpegPath: string | null = null;
  let ffprobePath: string | null = null;

  // Search in PATH
  for (const [command, binary] of searchCommands) {
    try {
      const result = await new Promise<string | null>((resolve) => {
        const which = spawn(command, [binary], {
          stdio: "pipe",
          windowsHide: true,
        });
        let output = "";

        which.stdout.on("data", (data) => {
          output += data.toString().trim();
        });

        which.on("close", async (code) => {
          if (code === 0 && output) {
            const foundPath = output.split("\n")[0].trim();
            console.log(`Found ${binary} via ${command}: ${foundPath}`);

            // Test if the binary actually works
            const works = await testBinaryPath(foundPath);
            if (works) {
              resolve(foundPath);
            } else {
              console.warn(`${binary} found but doesn't work: ${foundPath}`);
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });

        which.on("error", () => resolve(null));

        setTimeout(() => {
          if (!which.killed) {
            which.kill();
            resolve(null);
          }
        }, 5000);
      });

      if (result) {
        if (binary === "ffmpeg") {
          ffmpegPath = result;
        } else if (binary === "ffprobe") {
          ffprobePath = result;
        }
      }
    } catch (error) {
      console.warn(`Failed to find ${binary} via ${command}:`, error);
    }
  }

  // If we found ffmpeg but not ffprobe (or vice versa), try to find the other in the same directory
  if (ffmpegPath && !ffprobePath) {
    const dir = path.dirname(ffmpegPath);
    const possibleProbe = path.join(
      dir,
      process.platform === "win32" ? "ffprobe.exe" : "ffprobe"
    );
    if (fs.existsSync(possibleProbe) && (await testBinaryPath(possibleProbe))) {
      ffprobePath = possibleProbe;
      console.log(`Found ffprobe in same directory as ffmpeg: ${ffprobePath}`);
    }
  }

  if (ffprobePath && !ffmpegPath) {
    const dir = path.dirname(ffprobePath);
    const possibleMpeg = path.join(
      dir,
      process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
    );
    if (fs.existsSync(possibleMpeg) && (await testBinaryPath(possibleMpeg))) {
      ffmpegPath = possibleMpeg;
      console.log(`Found ffmpeg in same directory as ffprobe: ${ffmpegPath}`);
    }
  }

  // If not found in PATH, try common installation paths
  if (!ffmpegPath || !ffprobePath) {
    console.log("🔍 Searching common installation paths...");

    const commonPaths =
      process.platform === "win32"
        ? [
            "C:\\ProgramData\\chocolatey\\bin\\",
            "C:\\ffmpeg\\bin\\",
            "C:\\Program Files\\ffmpeg\\bin\\",
            "C:\\Program Files (x86)\\ffmpeg\\bin\\",
            "C:\\tools\\ffmpeg\\bin\\",
          ]
        : ["/usr/local/bin/", "/opt/homebrew/bin/", "/usr/bin/", "/snap/bin/"];

    const binaries =
      process.platform === "win32"
        ? ["ffmpeg.exe", "ffprobe.exe"]
        : ["ffmpeg", "ffprobe"];

    for (const basePath of commonPaths) {
      for (const binary of binaries) {
        const fullPath = path.join(basePath, binary);
        if (fs.existsSync(fullPath)) {
          console.log(`Testing common path: ${fullPath}`);
          const works = await testBinaryPath(fullPath);
          if (works) {
            if (binary.includes("ffmpeg") && !ffmpegPath) {
              ffmpegPath = fullPath;
              console.log(`✅ Found working ffmpeg: ${fullPath}`);
            } else if (binary.includes("ffprobe") && !ffprobePath) {
              ffprobePath = fullPath;
              console.log(`✅ Found working ffprobe: ${fullPath}`);
            }
          }
        }
      }

      // If we found both in this directory, break
      if (ffmpegPath && ffprobePath) break;
    }
  }

  console.log("📊 FFmpeg binary search results:");
  console.log(`  ffmpeg: ${ffmpegPath || "❌ not found"}`);
  console.log(`  ffprobe: ${ffprobePath || "❌ not found"}`);

  return { ffmpeg: ffmpegPath, ffprobe: ffprobePath };
}

async function initializeFFmpeg(): Promise<void> {
  try {
    console.log("🚀 Initializing FFmpeg...");

    // First, try to find FFmpeg binaries
    const binaries = await findFFmpegBinaries();
    ffmpegBinaryPath = binaries.ffmpeg;
    ffprobeBinaryPath = binaries.ffprobe;

    if (!ffmpegBinaryPath || !ffprobeBinaryPath) {
      console.warn(
        "⚠️ FFmpeg binaries not found. Please ensure FFmpeg is installed:"
      );
      console.warn("  Windows: choco install ffmpeg");
      console.warn("  macOS: brew install ffmpeg");
      console.warn("  Linux: sudo apt install ffmpeg");
      console.warn("  Manual: https://ffmpeg.org/download.html");

      ffmpegAvailable = false;
      return;
    }

    // Try to load fluent-ffmpeg module
    let moduleFound = false;

    try {
      console.log("📦 Loading fluent-ffmpeg module...");

      if (app.isPackaged) {
        const possibleFFmpegPaths = [
          path.join(
            process.resourcesPath,
            "app.asar.unpacked",
            "node_modules",
            "fluent-ffmpeg"
          ),
          path.join(process.resourcesPath, "node_modules", "fluent-ffmpeg"),
          path.join(__dirname, "..", "..", "node_modules", "fluent-ffmpeg"),
          path.join(process.cwd(), "node_modules", "fluent-ffmpeg"),
        ];

        for (const ffmpegModulePath of possibleFFmpegPaths) {
          try {
            console.log(`  Trying: ${ffmpegModulePath}`);
            if (fs.existsSync(ffmpegModulePath)) {
              ffmpeg = require(ffmpegModulePath);
              console.log(`✅ fluent-ffmpeg loaded from: ${ffmpegModulePath}`);
              moduleFound = true;
              break;
            }
          } catch (pathError: unknown) {
            console.warn(
              `  Failed to load from ${ffmpegModulePath}:`,
              pathError instanceof Error ? pathError.message : String(pathError)
            );
          }
        }

        if (!moduleFound) {
          try {
            ffmpeg = require("fluent-ffmpeg");
            console.log("✅ fluent-ffmpeg loaded from regular require");
            moduleFound = true;
          } catch (fallbackError: unknown) {
            console.warn(
              "❌ Failed regular require:",
              fallbackError instanceof Error
                ? fallbackError.message
                : String(fallbackError)
            );
          }
        }
      } else {
        // Development mode
        try {
          ffmpeg = require("fluent-ffmpeg");
          console.log("✅ fluent-ffmpeg loaded in development");
          moduleFound = true;
        } catch (devError: unknown) {
          console.error(
            "❌ fluent-ffmpeg not found in development. Run: bun add fluent-ffmpeg @types/fluent-ffmpeg"
          );
          moduleFound = false;
        }
      }
    } catch (moduleError: unknown) {
      console.error(
        "❌ Failed to load fluent-ffmpeg module:",
        moduleError instanceof Error ? moduleError.message : String(moduleError)
      );
      moduleFound = false;
    }

    // Configure fluent-ffmpeg with binary paths
    if (moduleFound && ffmpeg) {
      try {
        if (ffmpegBinaryPath) {
          ffmpeg.setFfmpegPath(ffmpegBinaryPath);
          console.log(`🔧 Set ffmpeg path: ${ffmpegBinaryPath}`);
        }
        if (ffprobeBinaryPath) {
          ffmpeg.setFfprobePath(ffprobeBinaryPath);
          console.log(`🔧 Set ffprobe path: ${ffprobeBinaryPath}`);
        }

        // Test the configuration with a simple command
        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input("color=black:size=1x1:duration=0.1")
            .inputFormat("lavfi")
            .output("-")
            .outputFormat("null")
            .on("end", () => {
              console.log("✅ FFmpeg configuration test successful");
              resolve();
            })
            .on("error", (err: Error) => {
              console.warn("⚠️ FFmpeg configuration test failed:", err.message);
              // Don't fail initialization, just log warning
              resolve();
            })
            .run();
        });
      } catch (configError: unknown) {
        console.warn(
          "⚠️ FFmpeg configuration failed:",
          configError instanceof Error
            ? configError.message
            : String(configError)
        );
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
    console.error("❌ Failed to initialize FFmpeg:", error);
    console.error("Video processing features will be disabled.");
    ffmpeg = null;
    ffmpegAvailable = false;
  }
}

// Initialize when module loads
initializeFFmpeg();

export class FFmpegManager {
  private ensureFFmpegAvailable(): void {
    if (
      !ffmpegAvailable ||
      !ffmpeg ||
      !ffmpegBinaryPath ||
      !ffprobeBinaryPath
    ) {
      const missingComponents: string[] = [];
      if (!ffmpegBinaryPath) missingComponents.push("ffmpeg binary");
      if (!ffprobeBinaryPath) missingComponents.push("ffprobe binary");
      if (!ffmpeg) missingComponents.push("fluent-ffmpeg module");

      throw new Error(
        `FFmpeg is not fully available. Missing: ${missingComponents.join(
          ", "
        )}.\n` +
          "Please install FFmpeg:\n" +
          "  Windows: choco install ffmpeg\n" +
          "  macOS: brew install ffmpeg\n" +
          "  Linux: sudo apt install ffmpeg\n" +
          "  Manual: https://ffmpeg.org/download.html\n" +
          "And ensure fluent-ffmpeg is installed: bun add fluent-ffmpeg @types/fluent-ffmpeg"
      );
    }
  }

  async reinitializeFFmpeg(): Promise<boolean> {
    console.log("🔄 Reinitializing FFmpeg...");
    await initializeFFmpeg();
    return ffmpegAvailable;
  }

  isFFmpegAvailable(): boolean {
    return ffmpegAvailable;
  }

  getFFmpegInfo(): {
    available: boolean;
    ffmpegPath?: string;
    ffprobePath?: string;
    moduleLoaded: boolean;
  } {
    return {
      available: ffmpegAvailable,
      ffmpegPath: ffmpegBinaryPath || undefined,
      ffprobePath: ffprobeBinaryPath || undefined,
      moduleLoaded: !!ffmpeg,
    };
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
