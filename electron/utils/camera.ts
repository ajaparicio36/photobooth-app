import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Camera, CaptureOptions, FrameData } from "../types/camera.type";

export enum CameraErrorType {
  NO_WSL = "NO_WSL",
  NO_GPHOTO2 = "NO_GPHOTO2",
  NO_CAMERAS = "NO_CAMERAS",
  CAMERA_BUSY = "CAMERA_BUSY",
  CAPTURE_FAILED = "CAPTURE_FAILED",
  PREVIEW_FAILED = "PREVIEW_FAILED",
  UNKNOWN = "UNKNOWN",
}

export class CameraError extends Error {
  constructor(
    message: string,
    public type: CameraErrorType,
    public shouldFallbackToWebcam: boolean = false
  ) {
    super(message);
    this.name = "CameraError";
  }
}

export class CameraManager {
  private previewProcess: ChildProcess | null = null;
  private frameCallback: ((frame: FrameData) => void) | null = null;
  private wslAvailable: boolean | null = null;

  private async checkWSLAvailability(): Promise<boolean> {
    if (this.wslAvailable !== null) {
      return this.wslAvailable;
    }

    return new Promise((resolve) => {
      // Check if we're on Windows first
      if (os.platform() !== "win32") {
        this.wslAvailable = false;
        resolve(false);
        return;
      }

      const wsl = spawn("wsl", ["--status"], { timeout: 5000 });

      wsl.on("error", () => {
        this.wslAvailable = false;
        resolve(false);
      });

      wsl.on("close", (code) => {
        this.wslAvailable = code === 0;
        resolve(code === 0);
      });

      setTimeout(() => {
        if (!wsl.killed) {
          wsl.kill();
          this.wslAvailable = false;
          resolve(false);
        }
      }, 3000);
    });
  }

  private async checkGphoto2InWSL(): Promise<boolean> {
    if (!(await this.checkWSLAvailability())) {
      return false;
    }

    return new Promise((resolve) => {
      // Try multiple ways to check for gphoto2
      const checkCommands = [
        ["which", "gphoto2"],
        ["command", "-v", "gphoto2"],
        ["whereis", "gphoto2"],
        [
          "bash",
          "-c",
          "which gphoto2 || command -v gphoto2 || echo /usr/bin/gphoto2",
        ],
      ];

      let attempts = 0;

      const tryNextCommand = () => {
        if (attempts >= checkCommands.length) {
          // Last resort: try to run gphoto2 directly to see if it exists
          const directTest = spawn("wsl", ["gphoto2", "--version"], {
            timeout: 5000,
          });

          directTest.on("error", () => resolve(false));
          directTest.on("close", (code) => {
            // If gphoto2 --version succeeds, it's installed
            resolve(code === 0);
          });

          setTimeout(() => {
            if (!directTest.killed) {
              directTest.kill();
              resolve(false);
            }
          }, 3000);
          return;
        }

        const cmd = checkCommands[attempts];
        const wsl = spawn("wsl", cmd, { timeout: 5000 });

        let output = "";

        wsl.stdout?.on("data", (data) => {
          output += data.toString();
        });

        wsl.on("error", () => {
          attempts++;
          tryNextCommand();
        });

        wsl.on("close", (code) => {
          if (code === 0 && output.trim() && output.includes("gphoto2")) {
            resolve(true);
          } else {
            attempts++;
            tryNextCommand();
          }
        });

        setTimeout(() => {
          if (!wsl.killed) {
            wsl.kill();
            attempts++;
            tryNextCommand();
          }
        }, 3000);
      };

      tryNextCommand();
    });
  }

  private convertWindowsPathToWSL(windowsPath: string): string {
    // Convert Windows path to WSL path
    // C:\path\to\file -> /mnt/c/path/to/file
    const normalized = path.normalize(windowsPath).replace(/\\/g, "/");
    if (normalized.match(/^[A-Za-z]:/)) {
      const drive = normalized.charAt(0).toLowerCase();
      return `/mnt/${drive}${normalized.slice(2)}`;
    }
    return normalized;
  }

  private convertWSLPathToWindows(wslPath: string): string {
    // Convert WSL path back to Windows path
    // /mnt/c/path/to/file -> C:\path\to\file
    if (wslPath.startsWith("/mnt/")) {
      const parts = wslPath.split("/");
      if (parts.length >= 3) {
        const drive = parts[2].toUpperCase();
        const pathPart = parts.slice(3).join("\\");
        return `${drive}:\\${pathPart}`;
      }
    }
    return wslPath;
  }

  async getAvailableCameras(): Promise<Camera[]> {
    return new Promise(async (resolve, reject) => {
      if (!(await this.checkWSLAvailability())) {
        reject(
          new CameraError(
            "WSL not available. Please install WSL with Ubuntu to use DSLR cameras.",
            CameraErrorType.NO_WSL,
            true
          )
        );
        return;
      }

      if (!(await this.checkGphoto2InWSL())) {
        reject(
          new CameraError(
            "gphoto2 not found in WSL. Please ensure gphoto2 is installed and accessible: sudo apt update && sudo apt install gphoto2 libgphoto2-dev",
            CameraErrorType.NO_GPHOTO2,
            true
          )
        );
        return;
      }

      // Simplified command without complex PATH manipulation
      const gphoto = spawn("wsl", ["gphoto2", "--auto-detect"]);
      let output = "";
      let errorOutput = "";

      gphoto.stdout.on("data", (data) => {
        output += data.toString();
      });

      gphoto.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      gphoto.on("error", (err) => {
        reject(
          new CameraError(
            `Failed to execute gphoto2 in WSL: ${err.message}`,
            CameraErrorType.NO_GPHOTO2,
            true
          )
        );
      });

      gphoto.on("close", (code) => {
        console.log("gphoto2 --auto-detect output:", output);
        console.log("gphoto2 --auto-detect stderr:", errorOutput);

        if (code !== 0) {
          if (
            errorOutput.includes("no cameras found") ||
            output.includes("no cameras found") ||
            errorOutput.includes("No camera found")
          ) {
            reject(
              new CameraError(
                "No DSLR/mirrorless cameras detected. Make sure your camera is connected via USB and turned on.",
                CameraErrorType.NO_CAMERAS,
                true
              )
            );
            return;
          }

          if (
            errorOutput.includes("command not found") ||
            errorOutput.includes("gphoto2: not found")
          ) {
            reject(
              new CameraError(
                "gphoto2 command not found. Please install: sudo apt update && sudo apt install gphoto2 libgphoto2-dev",
                CameraErrorType.NO_GPHOTO2,
                true
              )
            );
            return;
          }

          reject(
            new CameraError(
              `Camera detection failed (code ${code}): ${
                errorOutput || output || "Unknown error"
              }`,
              CameraErrorType.UNKNOWN,
              true
            )
          );
          return;
        }

        const cameras: Camera[] = [];
        const lines = output.split("\n");

        // Skip header lines and parse camera list
        for (let i = 2; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line && !line.startsWith("-") && line.length > 0) {
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
              cameras.push({
                model: parts.slice(0, -1).join(" "),
                port: parts[parts.length - 1],
                id: `${parts.slice(0, -1).join(" ")}_${
                  parts[parts.length - 1]
                }`,
              });
            }
          }
        }

        console.log("Detected cameras:", cameras);

        if (cameras.length === 0) {
          reject(
            new CameraError(
              "No cameras detected. Ensure your camera is connected via USB, turned on, and not being used by another application.",
              CameraErrorType.NO_CAMERAS,
              true
            )
          );
        } else {
          resolve(cameras);
        }
      });

      // Set timeout for camera detection
      setTimeout(() => {
        if (!gphoto.killed) {
          gphoto.kill();
          reject(
            new CameraError(
              "Camera detection timed out. Use webcam fallback.",
              CameraErrorType.UNKNOWN,
              true
            )
          );
        }
      }, 15000); // Increased timeout to 15 seconds
    });
  }

  async captureImage(
    outputPath: string,
    options: CaptureOptions = {}
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (!(await this.checkWSLAvailability())) {
        reject(
          new CameraError("WSL not available", CameraErrorType.NO_WSL, true)
        );
        return;
      }

      // Create a temporary directory in WSL for capture
      const tempDir = "/tmp/photobooth";
      const tempFileName = `capture_${Date.now()}.jpg`;
      const wslTempPath = `${tempDir}/${tempFileName}`;

      // Step 1: Create directory
      const mkdirProcess = spawn("wsl", ["mkdir", "-p", tempDir]);

      mkdirProcess.on("close", (mkdirCode) => {
        if (mkdirCode !== 0) {
          reject(
            new CameraError(
              "Failed to create temp directory in WSL",
              CameraErrorType.CAPTURE_FAILED,
              true
            )
          );
          return;
        }

        // Step 2: Capture image
        const captureArgs = [
          "gphoto2",
          "--capture-image-and-download",
          "--filename",
          wslTempPath,
        ];

        if (options.format) {
          captureArgs.splice(
            1,
            0,
            "--set-config",
            `imageformat=${options.format}`
          );
        }

        const gphoto = spawn("wsl", captureArgs);

        let output = "";
        let errorOutput = "";

        gphoto.stdout.on("data", (data) => {
          const dataStr = data.toString();
          output += dataStr;
          console.log("gphoto2 capture stdout:", dataStr);
        });

        gphoto.stderr.on("data", (data) => {
          const dataStr = data.toString();
          errorOutput += dataStr;
          console.error("gphoto2 capture stderr:", dataStr);
        });

        gphoto.on("error", (err) => {
          reject(
            new CameraError(
              `WSL gphoto2 process failed to start: ${err.message}`,
              CameraErrorType.NO_GPHOTO2,
              true
            )
          );
        });

        gphoto.on("close", async (code) => {
          console.log(`gphoto2 capture process closed with code: ${code}`);
          console.log("Final output:", output);
          console.log("Final error output:", errorOutput);

          // Check if file was created
          const checkFile = spawn("wsl", ["test", "-f", wslTempPath]);

          checkFile.on("close", async (checkCode) => {
            const fileExists = checkCode === 0;
            console.log("File exists check:", fileExists);

            if (!fileExists) {
              if (
                errorOutput.includes("busy") ||
                errorOutput.includes("locked")
              ) {
                reject(
                  new CameraError(
                    "Camera is busy or locked by another application",
                    CameraErrorType.CAMERA_BUSY,
                    true
                  )
                );
              } else if (
                errorOutput.includes("no camera found") ||
                errorOutput.includes("No camera found")
              ) {
                reject(
                  new CameraError(
                    "Camera disconnected or not found",
                    CameraErrorType.NO_CAMERAS,
                    true
                  )
                );
              } else {
                reject(
                  new CameraError(
                    `Image capture failed (code ${code}): ${
                      errorOutput || output || "Unknown error"
                    }`,
                    CameraErrorType.CAPTURE_FAILED,
                    true
                  )
                );
              }
              return;
            }

            try {
              // Copy file from WSL to Windows
              const windowsOutputPath = path.resolve(outputPath);

              // Ensure temp directory exists on Windows
              const tempDirWin = path.join(os.tmpdir(), "photobooth-app");
              if (!fs.existsSync(tempDirWin)) {
                fs.mkdirSync(tempDirWin, { recursive: true });
              }

              const finalTempPath = path.join(
                tempDirWin,
                `captured_${Date.now()}.jpg`
              );
              const wslFinalPath = this.convertWindowsPathToWSL(finalTempPath);

              console.log(
                "Copying from WSL:",
                wslTempPath,
                "to Windows:",
                wslFinalPath
              );

              const copyProcess = spawn("wsl", [
                "cp",
                wslTempPath,
                wslFinalPath,
              ]);

              copyProcess.on("close", (copyCode) => {
                console.log("Copy process closed with code:", copyCode);

                if (copyCode === 0 && fs.existsSync(finalTempPath)) {
                  // Move to final destination
                  try {
                    fs.copyFileSync(finalTempPath, windowsOutputPath);
                    fs.unlinkSync(finalTempPath); // Clean up temp file

                    // Clean up WSL temp file
                    spawn("wsl", ["rm", "-f", wslTempPath]);

                    console.log(
                      "Successfully captured and saved image to:",
                      windowsOutputPath
                    );
                    resolve(windowsOutputPath);
                  } catch (fsError) {
                    reject(
                      new CameraError(
                        `Failed to move captured file: ${fsError}`,
                        CameraErrorType.CAPTURE_FAILED,
                        false
                      )
                    );
                  }
                } else {
                  reject(
                    new CameraError(
                      "Failed to copy captured file from WSL",
                      CameraErrorType.CAPTURE_FAILED,
                      true
                    )
                  );
                }
              });
            } catch (error) {
              reject(
                new CameraError(
                  `File operation failed: ${error}`,
                  CameraErrorType.CAPTURE_FAILED,
                  true
                )
              );
            }
          });
        });

        // Set timeout for capture
        setTimeout(() => {
          if (!gphoto.killed) {
            gphoto.kill();
            reject(
              new CameraError(
                "Image capture timed out",
                CameraErrorType.CAPTURE_FAILED,
                true
              )
            );
          }
        }, 20000); // 20 second timeout
      });
    });
  }

  startPreview(onFrame: (frame: FrameData) => void): void {
    this.stopPreview();
    this.frameCallback = onFrame;

    this.checkWSLAvailability().then((available) => {
      if (!available) {
        console.error("WSL not available for preview");
        return;
      }

      try {
        this.previewProcess = spawn("wsl", [
          "gphoto2",
          "--capture-preview",
          "--stdout",
        ]);

        let buffer = Buffer.alloc(0);
        let lastFrameTime = Date.now();

        this.previewProcess.stdout?.on("data", (data) => {
          buffer = Buffer.concat([buffer, data]);

          // Look for JPEG markers
          const startMarker = Buffer.from([0xff, 0xd8]);
          const endMarker = Buffer.from([0xff, 0xd9]);

          let startIndex = buffer.indexOf(startMarker);

          while (startIndex !== -1) {
            const endIndex = buffer.indexOf(endMarker, startIndex);

            if (endIndex !== -1) {
              const frameBuffer = buffer.slice(startIndex, endIndex + 2);

              if (this.frameCallback && frameBuffer.length > 100) {
                // Ensure it's a valid frame
                this.frameCallback({
                  data: frameBuffer,
                  timestamp: Date.now(),
                });
                lastFrameTime = Date.now();
              }

              buffer = buffer.slice(endIndex + 2);
              startIndex = buffer.indexOf(startMarker);
            } else {
              break;
            }
          }
        });

        this.previewProcess.stderr?.on("data", (data) => {
          const error = data.toString();
          console.error("Preview stderr:", error);

          if (error.includes("no camera found") || error.includes("busy")) {
            this.stopPreview();
            // Could emit an error event here if needed
          }
        });

        this.previewProcess.on("error", (err) => {
          console.error("Preview process error:", err);
          this.stopPreview();
        });

        this.previewProcess.on("close", (code) => {
          if (code !== 0) {
            console.error("Preview process closed with code:", code);
          }
          this.stopPreview();
        });
      } catch (error) {
        console.error("Failed to start preview:", error);
        this.stopPreview();
      }
    });
  }

  stopPreview(): void {
    if (this.previewProcess) {
      this.previewProcess.kill("SIGTERM");
      setTimeout(() => {
        if (this.previewProcess && !this.previewProcess.killed) {
          this.previewProcess.kill("SIGKILL");
        }
      }, 1000);
      this.previewProcess = null;
    }
    this.frameCallback = null;
  }

  async isGphoto2Available(): Promise<boolean> {
    try {
      const wslAvailable = await this.checkWSLAvailability();
      if (!wslAvailable) return false;

      const gphotoAvailable = await this.checkGphoto2InWSL();
      if (!gphotoAvailable) return false;

      const cameras = await this.getAvailableCameras();
      return cameras.length > 0;
    } catch (error) {
      return false;
    }
  }
}

export const cameraManager = new CameraManager();
