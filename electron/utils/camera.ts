import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { Camera, CaptureOptions, FrameData } from "../types/camera.type";

export enum CameraErrorType {
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

  async getAvailableCameras(): Promise<Camera[]> {
    return new Promise((resolve, reject) => {
      // Check if gphoto2 is available
      const gphoto = spawn("gphoto2", ["--auto-detect"]);
      let output = "";
      let errorOutput = "";

      gphoto.stdout.on("data", (data) => {
        output += data.toString();
      });

      gphoto.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      gphoto.on("error", (err) => {
        // gphoto2 not installed or not in PATH
        reject(
          new CameraError(
            "gphoto2 not found. Please install gphoto2 or use webcam fallback.",
            CameraErrorType.NO_GPHOTO2,
            true
          )
        );
      });

      gphoto.on("close", (code) => {
        if (code !== 0) {
          // Check for specific error patterns
          if (
            errorOutput.includes("no cameras found") ||
            output.includes("no cameras found")
          ) {
            reject(
              new CameraError(
                "No DSLR/mirrorless cameras detected. Use webcam fallback.",
                CameraErrorType.NO_CAMERAS,
                true
              )
            );
            return;
          }

          reject(
            new CameraError(
              `Camera detection failed: ${errorOutput || "Unknown error"}`,
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
          if (line && !line.startsWith("-")) {
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

        if (cameras.length === 0) {
          reject(
            new CameraError(
              "No cameras detected. Use webcam fallback.",
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
      }, 10000); // 10 second timeout
    });
  }

  async captureImage(
    outputPath: string,
    options: CaptureOptions = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = ["--capture-image-and-download"];

      if (options.format) {
        args.push("--set-config", `imageformat=${options.format}`);
      }

      const gphoto = spawn("gphoto2", args, {
        cwd: path.dirname(outputPath),
      });

      let capturedFile = "";
      let errorOutput = "";

      gphoto.stdout.on("data", (data) => {
        const output = data.toString();
        const match = output.match(/Saving file as (.+)/);
        if (match) {
          capturedFile = match[1].trim();
        }
      });

      gphoto.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      gphoto.on("error", (err) => {
        reject(
          new CameraError(
            "gphoto2 process failed to start",
            CameraErrorType.NO_GPHOTO2,
            true
          )
        );
      });

      gphoto.on("close", (code) => {
        if (code !== 0) {
          // Parse specific error types
          if (errorOutput.includes("busy") || errorOutput.includes("locked")) {
            reject(
              new CameraError(
                "Camera is busy or locked by another application",
                CameraErrorType.CAMERA_BUSY,
                true
              )
            );
          } else if (errorOutput.includes("no camera found")) {
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
                `Image capture failed: ${errorOutput || "Unknown error"}`,
                CameraErrorType.CAPTURE_FAILED,
                true
              )
            );
          }
          return;
        }

        if (capturedFile) {
          const sourcePath = path.join(path.dirname(outputPath), capturedFile);
          if (fs.existsSync(sourcePath)) {
            try {
              fs.renameSync(sourcePath, outputPath);
              resolve(outputPath);
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
                "Captured file not found on disk",
                CameraErrorType.CAPTURE_FAILED,
                true
              )
            );
          }
        } else {
          reject(
            new CameraError(
              "No file was captured",
              CameraErrorType.CAPTURE_FAILED,
              true
            )
          );
        }
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
      }, 15000); // 15 second timeout
    });
  }

  startPreview(onFrame: (frame: FrameData) => void): void {
    this.stopPreview();
    this.frameCallback = onFrame;

    try {
      this.previewProcess = spawn("gphoto2", ["--capture-preview", "--stdout"]);

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

      // Monitor for frame timeout
      const frameTimeout = setInterval(() => {
        if (Date.now() - lastFrameTime > 5000) {
          // No frames for 5 seconds
          console.warn("Preview frames stopped, restarting...");
          clearInterval(frameTimeout);
          if (this.frameCallback) {
            const callback = this.frameCallback;
            this.stopPreview();
            setTimeout(() => this.startPreview(callback), 1000);
          }
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to start preview:", error);
      this.stopPreview();
    }
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

  // Health check method
  async isGphoto2Available(): Promise<boolean> {
    try {
      const cameras = await this.getAvailableCameras();
      return cameras.length > 0;
    } catch (error) {
      if (error instanceof CameraError && error.shouldFallbackToWebcam) {
        return false;
      }
      return false;
    }
  }
}

export const cameraManager = new CameraManager();
