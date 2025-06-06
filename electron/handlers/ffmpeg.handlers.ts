import { ipcMain } from "electron";
import { ffmpegManager } from "../utils/ffmpeg";
import { flipbookManager } from "../utils/flipbook";
import { FlipbookOptions } from "../types/ffmpeg.type";

export function registerFFmpegHandlers() {
  ipcMain.handle("get-video-info", async (_, videoPath: string) => {
    try {
      return await ffmpegManager.getVideoInfo(videoPath);
    } catch (error) {
      console.error("Failed to get video info:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "extract-video-frames",
    async (_, videoPath: string, outputDir: string, options: any) => {
      try {
        return await ffmpegManager.extractFrames(videoPath, outputDir, options);
      } catch (error) {
        console.error("Failed to extract video frames:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "create-flipbook",
    async (
      _,
      videoPath: string,
      outputDir: string,
      options: FlipbookOptions
    ) => {
      try {
        return await flipbookManager.createFlipbook(
          videoPath,
          outputDir,
          options
        );
      } catch (error) {
        console.error("Failed to create flipbook:", error);
        throw error; // Rethrow to be caught by the frontend
      }
    }
  );

  ipcMain.handle("check-ffmpeg-health", async () => {
    try {
      const isAvailable = ffmpegManager.isFFmpegAvailable();
      const info = ffmpegManager.getFFmpegInfo();

      if (!isAvailable) {
        const missingComponents: string[] = [];
        if (!info.ffmpegPath) missingComponents.push("ffmpeg binary");
        if (!info.ffprobePath) missingComponents.push("ffprobe binary");
        if (!info.moduleLoaded) missingComponents.push("fluent-ffmpeg module");

        return {
          available: false,
          error: `Missing components: ${missingComponents.join(", ")}`,
          message:
            "Please install FFmpeg and ensure fluent-ffmpeg module is available",
          details: info,
          installInstructions: {
            windows: "choco install ffmpeg",
            macos: "brew install ffmpeg",
            linux: "sudo apt install ffmpeg",
            module: "bun add fluent-ffmpeg @types/fluent-ffmpeg",
          },
        };
      }

      return {
        available: true,
        message: "FFmpeg is available and ready",
        details: info,
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "FFmpeg health check failed",
      };
    }
  });
}
