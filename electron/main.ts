import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { isDev } from "./util";
import { cameraManager } from "./utils/camera";
import { printerManager } from "./utils/printer";

app.commandLine.appendSwitch("disable-web-security");

let mainWindow: BrowserWindow;

const createWindow = (): void => {
  // Debug logging
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("isDev:", isDev);
  console.log("app.isPackaged:", app.isPackaged);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: false,
    },
    show: false, // Don't show until ready
    autoHideMenuBar: true, // Hide the menu bar
  });

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Force development mode for now
  const isDevMode = !app.isPackaged;

  if (isDevMode) {
    console.log("Loading development server...");
    mainWindow.loadURL("http://localhost:5173").catch((err) => {
      console.error("Failed to load dev server:", err);
      // Fallback to a simple HTML page
      mainWindow.loadURL(`data:text/html;charset=utf-8,
        <html>
          <body style="font-family: Arial; padding: 20px;">
            <h1>Development Server Not Running</h1>
            <p>Please start the Vite dev server with: <code>bun run dev</code></p>
            <p>Then restart Electron with: <code>bun run electron:dev</code></p>
            <p><strong>Make sure both commands are running in separate terminals!</strong></p>
          </body>
        </html>
      `);
    });
    mainWindow.webContents.openDevTools();
  } else {
    console.log("Loading production build...");
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Add error handling for web contents
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error("Failed to load page:", errorCode, errorDescription);
    }
  );
};

// IPC Handlers for Camera
ipcMain.handle("get-available-cameras", async () => {
  try {
    return await cameraManager.getAvailableCameras();
  } catch (error) {
    console.error("Failed to get cameras:", error);
    // Return structured error for frontend
    if (error instanceof Error) {
      throw {
        message: error.message,
        type: (error as any).type || "UNKNOWN",
        shouldFallbackToWebcam: (error as any).shouldFallbackToWebcam || false,
      };
    }
    throw error;
  }
});

ipcMain.handle("capture-image", async (_, outputPath: string, options: any) => {
  try {
    return await cameraManager.captureImage(outputPath, options);
  } catch (error) {
    console.error("Failed to capture image:", error);
    if (error instanceof Error) {
      throw {
        message: error.message,
        type: (error as any).type || "UNKNOWN",
        shouldFallbackToWebcam: (error as any).shouldFallbackToWebcam || false,
      };
    }
    throw error;
  }
});

ipcMain.handle("start-preview", async () => {
  try {
    cameraManager.startPreview((frame) => {
      if (mainWindow) {
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
        shouldFallbackToWebcam: (error as any).shouldFallbackToWebcam || false,
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

// Add health check endpoint
ipcMain.handle("check-camera-health", async () => {
  try {
    return await cameraManager.isGphoto2Available();
  } catch (error) {
    return false;
  }
});

// IPC Handlers for Printer
ipcMain.handle("get-available-printers", async () => {
  try {
    return await printerManager.getAvailablePrinters();
  } catch (error) {
    console.error("Failed to get printers:", error);
    throw error;
  }
});

ipcMain.handle("get-default-printer", async () => {
  try {
    return await printerManager.getDefaultPrinter();
  } catch (error) {
    console.error("Failed to get default printer:", error);
    throw error;
  }
});

ipcMain.handle(
  "print-image",
  async (_, imagePath: string, printerName?: string, options?: any) => {
    try {
      return await printerManager.printImage(imagePath, printerName, options);
    } catch (error) {
      console.error("Failed to print image:", error);
      throw error;
    }
  }
);

ipcMain.handle("print-images", async (_, images: string[]) => {
  try {
    return await printerManager.printImages(images);
  } catch (error) {
    console.error("Failed to print images:", error);
    throw error;
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
