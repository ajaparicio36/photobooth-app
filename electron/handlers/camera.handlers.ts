import { ipcMain } from "electron";
import { cameraManager } from "../utils/camera";

export function registerCameraHandlers(mainWindow: Electron.BrowserWindow) {
  ipcMain.handle("get-available-cameras", async () => {
    try {
      console.log("Attempting to get available cameras...");
      const cameras = await cameraManager.getAvailableCameras();
      console.log("Successfully found cameras:", cameras);
      return cameras;
    } catch (error) {
      console.error("Failed to get cameras:", error);
      if (error instanceof Error) {
        const structuredError = {
          message: error.message,
          type: (error as any).type || "UNKNOWN",
          shouldFallbackToWebcam:
            (error as any).shouldFallbackToWebcam || false,
        };
        console.log("Returning structured error:", structuredError);
        throw structuredError;
      }
      throw error;
    }
  });

  ipcMain.handle(
    "capture-image",
    async (_, outputPath: string, options: any) => {
      try {
        console.log("Attempting to capture image to:", outputPath);
        const result = await cameraManager.captureImage(outputPath, options);
        console.log("Successfully captured image:", result);
        return result;
      } catch (error) {
        console.error("Failed to capture image:", error);
        if (error instanceof Error) {
          const structuredError = {
            message: error.message,
            type: (error as any).type || "UNKNOWN",
            shouldFallbackToWebcam:
              (error as any).shouldFallbackToWebcam || false,
          };
          console.log("Returning capture error:", structuredError);
          throw structuredError;
        }
        throw error;
      }
    }
  );

  ipcMain.handle("start-preview", async () => {
    try {
      cameraManager.startPreview((frame) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("camera-frame", frame);
        }
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to start preview:", error);
      if (error instanceof Error) {
        throw {
          message: error.message,
          type: (error as any).type || "UNKNOWN",
          shouldFallbackToWebcam:
            (error as any).shouldFallbackToWebcam || false,
        };
      }
      throw error;
    }
  });

  ipcMain.handle("stop-preview", async () => {
    try {
      cameraManager.stopPreview();
      return { success: true };
    } catch (error) {
      console.error("Failed to stop preview:", error);
      throw error;
    }
  });

  ipcMain.handle("check-camera-health", async () => {
    try {
      return await cameraManager.isGphoto2Available();
    } catch (error) {
      return false;
    }
  });
}
