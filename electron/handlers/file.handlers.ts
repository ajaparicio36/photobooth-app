import { ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export function registerFileHandlers() {
  ipcMain.handle("save-file", async (_, data: any, filePath: string) => {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await fs.promises.writeFile(filePath, Buffer.from(data));
      return { success: true, path: filePath };
    } catch (error) {
      console.error("Failed to save file:", error);
      throw error;
    }
  });

  ipcMain.handle("read-file", async (_, filePath: string) => {
    try {
      const data = await fs.promises.readFile(filePath);
      return data;
    } catch (error) {
      console.error("Failed to read file:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "create-temp-file",
    async (_, data: any, extension: string) => {
      try {
        const tempDir = path.join(os.tmpdir(), "photobooth-app");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempPath = path.join(tempDir, `temp_${Date.now()}.${extension}`);
        await fs.promises.writeFile(tempPath, Buffer.from(data));
        return { success: true, path: tempPath };
      } catch (error) {
        console.error("Failed to create temp file:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("cleanup-temp-files", async () => {
    try {
      const tempDir = path.join(os.tmpdir(), "photobooth-app");
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            console.warn(`Failed to delete temp file ${filePath}:`, error);
          }
        }
      }
      return { success: true };
    } catch (error) {
      console.error("Failed to cleanup temp files:", error);
      throw error;
    }
  });
}
