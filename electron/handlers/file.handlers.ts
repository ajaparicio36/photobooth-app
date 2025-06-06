import { ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { app } from "electron";

export function registerFileHandlers() {
  ipcMain.handle(
    "save-file",
    async (_, data: Buffer | ArrayBuffer | string, filePath: string) => {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        if (typeof data === "string") {
          fs.writeFileSync(filePath, data, "utf8");
        } else if (data instanceof ArrayBuffer) {
          fs.writeFileSync(filePath, Buffer.from(data));
        } else {
          fs.writeFileSync(filePath, data);
        }

        return { success: true, path: filePath };
      } catch (error) {
        console.error("Failed to save file:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("read-file", async (_, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: "File not found",
        };
      }

      const data = fs.readFileSync(filePath);
      return {
        success: true,
        data: Array.from(data), // Convert buffer to array for JSON serialization
        path: filePath,
      };
    } catch (error) {
      console.error("Failed to read file:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  ipcMain.handle(
    "create-temp-file",
    async (_, data: ArrayBuffer, extension: string) => {
      try {
        // Use consistent temp directory
        const customTempDir = "D:/tmp";
        const tempDir = fs.existsSync(customTempDir)
          ? customTempDir
          : os.tmpdir();

        const sessionDir = path.join(
          tempDir,
          `photobooth_session_${Date.now()}`
        );

        if (!fs.existsSync(sessionDir)) {
          fs.mkdirSync(sessionDir, { recursive: true });
        }

        const fileName = `temp_video_${Date.now()}${extension}`;
        const filePath = path.join(sessionDir, fileName);

        const buffer = Buffer.from(data);
        fs.writeFileSync(filePath, buffer);

        return { success: true, path: filePath };
      } catch (error) {
        console.error("Failed to create temp file:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  ipcMain.handle("cleanup-temp-files", async () => {
    try {
      const customTempDir = "D:/tmp";
      const tempDir = fs.existsSync(customTempDir)
        ? customTempDir
        : os.tmpdir();

      // Clean up photobooth session directories older than 1 hour
      const sessionDirs = fs
        .readdirSync(tempDir)
        .filter((dir) => dir.startsWith("photobooth_session_"));

      const oneHourAgo = Date.now() - 60 * 60 * 1000;

      for (const sessionDir of sessionDirs) {
        const fullPath = path.join(tempDir, sessionDir);
        try {
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory() && stats.mtime.getTime() < oneHourAgo) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`Cleaned up old session directory: ${fullPath}`);
          }
        } catch (cleanupError) {
          console.warn(`Failed to cleanup ${fullPath}:`, cleanupError);
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to cleanup temp files:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
}
