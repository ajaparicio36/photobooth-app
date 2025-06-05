import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { isDev, isTestingProd } from "./util";
import { cameraManager } from "./utils/camera";
import { printerManager } from "./utils/printer";
import { sharpManager } from "./utils/sharp";
import * as fs from "fs";
import * as os from "os";

app.commandLine.appendSwitch("disable-web-security");

let mainWindow: BrowserWindow;

// Add audio player reference
let audioPlayer: any = null;
let currentAudio: any = null; // Add HTML5 Audio API fallback

// Initialize Sharp early in the main process
async function initializeModules() {
  try {
    // Test Sharp availability with better error handling
    const { sharpManager } = await import("./utils/sharp");

    if (sharpManager.isSharpAvailable()) {
      console.log("Sharp module is available and ready");
    } else {
      console.warn(
        "Sharp module failed to initialize - trying to reinitialize..."
      );
      const reinitResult = await sharpManager.reinitializeSharp();
      if (reinitResult) {
        console.log("Sharp module successfully reinitialized");
      } else {
        console.error(
          "Sharp module could not be initialized - image processing will be limited"
        );
      }
    }
  } catch (error) {
    console.error("Module initialization failed:", error);
    console.error("Some features may not work properly");
  }
}

const createWindow = (): void => {
  // Debug logging
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("isDev:", isDev);
  console.log("isTestingProd:", isTestingProd);
  console.log("app.isPackaged:", app.isPackaged);
  console.log("app.getAppPath():", app.getAppPath());
  console.log("process.resourcesPath:", process.resourcesPath);
  console.log("__dirname:", __dirname);

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
    console.log("Window ready to show");
    mainWindow.show();

    // Only open dev tools in development or test:prod mode
    if (isDev || isTestingProd) {
      mainWindow.webContents.openDevTools();
    }
  });

  if (isDev) {
    console.log("Loading development server...");
    mainWindow.loadURL("http://localhost:5173").catch((err) => {
      console.error("Failed to load dev server:", err);
      // Fallback to a simple HTML page
      mainWindow.loadURL(
        `data:text/html;charset=utf-8,
        <html>
          <body style="font-family: Arial; padding: 20px;">
            <h1>Development Server Not Running</h1>
            <p>Please start the Vite dev server with: <code>npm run dev</code></p>
            <p>Then restart Electron with: <code>npm run electron:dev</code></p>
            <p><strong>Make sure both commands are running in separate terminals!</strong></p>
          </body>
        </html>
      `
      );
    });
    mainWindow.webContents.openDevTools();
  } else {
    console.log("Loading production build...");

    // For testing production build locally (not packaged) or actual packaged app
    const localDistPath = path.join(__dirname, "../dist/index.html");
    console.log("Testing production build at:", localDistPath);

    if (fs.existsSync(localDistPath)) {
      console.log("Loading production build from:", localDistPath);
      // Remove hash parameter since HashRouter will handle routing
      mainWindow.loadFile(localDistPath).catch((err) => {
        console.error("Failed to load production build:", err);
        mainWindow.loadURL(
          `data:text/html;charset=utf-8,
          <html>
            <body style="font-family: Arial; padding: 20px;">
              <h1>Production Build Error</h1>
              <p>Failed to load: ${localDistPath}</p>
              <p>Error: ${err.message}</p>
              <p>Check the console for more details.</p>
            </body>
          </html>
        `
        );
      });
      return;
    }

    // If local dist doesn't exist, try packaged app paths
    if (app.isPackaged) {
      const possiblePaths = [
        path.join(app.getAppPath(), "dist/index.html"),
        path.join(process.resourcesPath, "app/dist/index.html"),
        path.join(process.resourcesPath, "dist/index.html"),
        path.join(__dirname, "../../dist/index.html"),
      ];

      let indexPath = "";
      for (const testPath of possiblePaths) {
        console.log(
          "Testing packaged path:",
          testPath,
          "exists:",
          fs.existsSync(testPath)
        );
        if (fs.existsSync(testPath)) {
          indexPath = testPath;
          break;
        }
      }

      if (indexPath) {
        console.log("Loading index.html from:", indexPath);
        mainWindow.loadFile(indexPath).catch((err) => {
          console.error("Failed to load index.html:", err);
          // Show error page
          mainWindow.loadURL(
            `data:text/html;charset=utf-8,
            <html>
              <body style="font-family: Arial; padding: 20px;">
                <h1>Packaged Build Error</h1>
                <p>Failed to load the application build.</p>
                <p>Error: ${err.message}</p>
                <p>Tried to load: ${indexPath}</p>
              </body>
            </html>
          `
          );
        });
      } else {
        console.error("Could not find index.html in packaged app");
        console.log("Searched paths:", possiblePaths);

        // List files in expected directories for debugging
        possiblePaths.forEach((testPath) => {
          const dir = path.dirname(testPath);
          if (fs.existsSync(dir)) {
            console.log(`Contents of ${dir}:`, fs.readdirSync(dir));
          } else {
            console.log(`Directory does not exist: ${dir}`);
          }
        });

        // Show error page
        mainWindow.loadURL(
          `data:text/html;charset=utf-8,
          <html>
            <body style="font-family: Arial; padding: 20px;">
              <h1>Packaged Build Missing</h1>
              <p>The application build files were not found in the packaged app.</p>
              <p>Please ensure the build completed successfully before packaging.</p>
              <h3>Debug Info:</h3>
              <p>isPackaged: ${app.isPackaged}</p>
              <p>getAppPath: ${app.getAppPath()}</p>
              <p>resourcesPath: ${process.resourcesPath}</p>
              <p>__dirname: ${__dirname}</p>
            </body>
          </html>
        `
        );
      }
    } else {
      // Not packaged and no local dist found
      console.error("Production build not found. Run 'bun run build' first.");
      mainWindow.loadURL(
        `data:text/html;charset=utf-8,
        <html>
          <body style="font-family: Arial; padding: 20px;">
            <h1>Production Build Missing</h1>
            <p>No production build found at: ${localDistPath}</p>
            <p>Please run the following commands:</p>
            <ol>
              <li><code>bun run build</code> - Build the frontend</li>
              <li><code>npm run test:prod</code> - Test production build</li>
            </ol>
            <p>Or run <code>npm run debug:build</code> to see what files are generated.</p>
          </body>
        </html>
      `
      );
    }
  }

  // Add error handling for web contents
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      console.error(
        "Failed to load page:",
        errorCode,
        errorDescription,
        validatedURL
      );
    }
  );

  // Add console message logging
  mainWindow.webContents.on(
    "console-message",
    (event, level, message, line, sourceId) => {
      console.log(`Console [${level}]:`, message);
      if (line && sourceId) {
        console.log(`  at ${sourceId}:${line}`);
      }
    }
  );
};

// IPC Handlers for Camera
ipcMain.handle("get-available-cameras", async () => {
  try {
    console.log("Attempting to get available cameras...");
    const cameras = await cameraManager.getAvailableCameras();
    console.log("Successfully found cameras:", cameras);
    return cameras;
  } catch (error) {
    console.error("Failed to get cameras:", error);
    // Return structured error for frontend
    if (error instanceof Error) {
      const structuredError = {
        message: error.message,
        type: (error as any).type || "UNKNOWN",
        shouldFallbackToWebcam: (error as any).shouldFallbackToWebcam || false,
      };
      console.log("Returning structured error:", structuredError);
      throw structuredError;
    }
    throw error;
  }
});

ipcMain.handle("capture-image", async (_, outputPath: string, options: any) => {
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
        shouldFallbackToWebcam: (error as any).shouldFallbackToWebcam || false,
      };
      console.log("Returning capture error:", structuredError);
      throw structuredError;
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

// Add printer health check endpoint
ipcMain.handle("check-printer-health", async () => {
  try {
    return await printerManager.isPrinterModuleAvailable();
  } catch (error) {
    return false;
  }
});

// IPC Handlers for Sharp Image Processing
ipcMain.handle(
  "apply-image-filter",
  async (_, imagePath: string, filterName: string, outputPath: string) => {
    try {
      return await sharpManager.applyFilter(imagePath, filterName, outputPath);
    } catch (error) {
      console.error("Failed to apply image filter:", error);
      throw error;
    }
  }
);

ipcMain.handle(
  "apply-custom-image-filter",
  async (_, imagePath: string, options: any, outputPath: string) => {
    try {
      return await sharpManager.applyCustomFilter(
        imagePath,
        options,
        outputPath
      );
    } catch (error) {
      console.error("Failed to apply custom image filter:", error);
      throw error;
    }
  }
);

ipcMain.handle("get-available-image-filters", async () => {
  try {
    return sharpManager.getAvailableFilters();
  } catch (error) {
    console.error("Failed to get available filters:", error);
    throw error;
  }
});

ipcMain.handle("get-image-filter-info", async (_, filterName: string) => {
  try {
    return sharpManager.getFilterInfo(filterName);
  } catch (error) {
    console.error("Failed to get filter info:", error);
    throw error;
  }
});

ipcMain.handle(
  "build-collage",
  async (_, imagePaths: string[], outputPath: string, options: any) => {
    try {
      return await sharpManager.buildCollage(imagePaths, outputPath, options);
    } catch (error) {
      console.error("Failed to build collage:", error);
      throw error;
    }
  }
);

ipcMain.handle(
  "generate-print-pdf",
  async (_, imagePaths: string[], outputPath: string, options: any) => {
    try {
      // Use sharp manager to generate print-ready PDF
      return await sharpManager.generatePrintPDF(
        imagePaths,
        outputPath,
        options
      );
    } catch (error) {
      console.error("Failed to generate print PDF:", error);
      throw error;
    }
  }
);

// File operation handlers
ipcMain.handle("save-file", async (_, data: any, filePath: string) => {
  try {
    // Ensure directory exists
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

ipcMain.handle("create-temp-file", async (_, data: any, extension: string) => {
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
});

// Add cleanup temp files handler
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

// IPC Handlers for Audio
ipcMain.handle(
  "play-audio",
  async (_, audioPath: string, volume: number = 0.7) => {
    try {
      // Stop any currently playing audio
      if (audioPlayer) {
        audioPlayer.kill();
        audioPlayer = null;
      }

      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }

      // Resolve the audio file path
      let resolvedPath = audioPath;

      // If path starts with '/', treat as relative to public folder
      if (audioPath.startsWith("/")) {
        const relativePath = audioPath.substring(1);

        if (isDev) {
          // In development, look in the public folder
          resolvedPath = path.join(__dirname, "../public", relativePath);
        } else if (app.isPackaged) {
          // In packaged app, look in resources/public
          resolvedPath = path.join(
            process.resourcesPath,
            "public",
            relativePath
          );
        } else {
          // In production build testing (not packaged)
          const possiblePaths = [
            path.join(__dirname, "../dist", relativePath), // Vite copies public to dist root
            path.join(__dirname, "../public", relativePath), // Original public folder
            path.join(process.cwd(), "dist", relativePath), // From project root
            path.join(process.cwd(), "public", relativePath), // Fallback to source
          ];

          resolvedPath = "";
          for (const testPath of possiblePaths) {
            console.log(
              `Testing audio path: ${testPath} - exists: ${fs.existsSync(
                testPath
              )}`
            );
            if (fs.existsSync(testPath)) {
              resolvedPath = testPath;
              break;
            }
          }

          if (!resolvedPath) {
            console.log("Audio file not found in any of these paths:");
            possiblePaths.forEach((p) =>
              console.log("  -", p, "exists:", fs.existsSync(p))
            );
            throw new Error(
              `Audio file not found in any expected location: ${relativePath}`
            );
          }
        }
      }

      console.log("Attempting to play audio:", resolvedPath);

      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Audio file not found: ${resolvedPath}`);
      }

      // Convert to file:// URL for consistent access
      const fileUrl = `file://${resolvedPath.replace(/\\/g, "/")}`;
      console.log("Audio file URL:", fileUrl);

      // Method 1: Try using the main window's webContents to play audio
      try {
        if (mainWindow && !mainWindow.isDestroyed()) {
          const audioPlayResult = await mainWindow.webContents
            .executeJavaScript(`
            (async () => {
              try {
                // Stop any existing audio
                if (window.currentElectronAudio) {
                  window.currentElectronAudio.pause();
                  window.currentElectronAudio = null;
                }
                
                const audio = new Audio("${fileUrl}");
                audio.volume = ${Math.max(0, Math.min(1, volume))};
                window.currentElectronAudio = audio;
                
                return new Promise((resolve, reject) => {
                  audio.oncanplaythrough = () => {
                    audio.play()
                      .then(() => resolve({ success: true, method: 'webContents' }))
                      .catch(reject);
                  };
                  audio.onerror = (e) => reject(new Error('Audio load failed: ' + e.type));
                  audio.onended = () => {
                    window.currentElectronAudio = null;
                  };
                  
                  // Timeout after 5 seconds
                  setTimeout(() => reject(new Error('Audio load timeout')), 5000);
                });
              } catch (error) {
                throw new Error('WebContents audio failed: ' + error.message);
              }
            })()
          `);

          console.log(
            "Audio played successfully via webContents:",
            audioPlayResult
          );
          return { success: true, path: resolvedPath, method: "webContents" };
        }
      } catch (webContentsError) {
        console.warn("WebContents audio playback failed:", webContentsError);
      }

      // Method 2: Fallback to platform-specific audio players
      console.log("Falling back to system audio players...");

      if (process.platform === "win32") {
        // Windows: Use a more reliable approach with node-wav-player or mci
        try {
          // Try using Windows Media Control Interface (MCI) via PowerShell
          const { spawn } = require("child_process");
          const psScript = `
            Add-Type -AssemblyName presentationCore
            $mediaPlayer = New-Object system.windows.media.mediaplayer
            $mediaPlayer.open([uri]"${resolvedPath}")
            $mediaPlayer.Volume = ${volume}
            $mediaPlayer.Play()
            Start-Sleep -Seconds 3
            $mediaPlayer.Stop()
            $mediaPlayer.Close()
          `;

          audioPlayer = spawn("powershell", ["-Command", psScript], {
            stdio: "pipe",
            windowsHide: true,
          });

          return new Promise((resolve, reject) => {
            let resolved = false;

            audioPlayer.on("close", (code: number | null) => {
              if (!resolved) {
                resolved = true;
                if (code === 0) {
                  resolve({
                    success: true,
                    path: resolvedPath,
                    method: "powershell-mci",
                  });
                } else {
                  reject(new Error(`Audio playback failed with code: ${code}`));
                }
              }
            });

            audioPlayer.on("error", (err: Error) => {
              if (!resolved) {
                resolved = true;
                reject(new Error(`PowerShell audio error: ${err.message}`));
              }
            });

            // Timeout fallback
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                if (audioPlayer && !audioPlayer.killed) {
                  audioPlayer.kill();
                }
                resolve({
                  success: true,
                  path: resolvedPath,
                  method: "powershell-timeout",
                });
              }
            }, 4000);
          });
        } catch (psError) {
          console.warn("PowerShell MCI failed:", psError);

          // Last resort: Try basic PowerShell SoundPlayer
          try {
            const { spawn } = require("child_process");
            const command = `(New-Object Media.SoundPlayer "${resolvedPath}").PlaySync()`;
            audioPlayer = spawn("powershell", ["-Command", command], {
              stdio: "ignore",
              windowsHide: true,
            });

            return {
              success: true,
              path: resolvedPath,
              method: "powershell-soundplayer",
            };
          } catch (basicError) {
            console.warn("Basic PowerShell audio failed:", basicError);
          }
        }
      } else if (process.platform === "darwin") {
        // macOS: use afplay
        const { spawn } = require("child_process");
        audioPlayer = spawn("afplay", [resolvedPath], {
          stdio: "ignore",
        });
        return { success: true, path: resolvedPath, method: "afplay" };
      } else {
        // Linux: try multiple audio players
        const { spawn } = require("child_process");
        try {
          audioPlayer = spawn("aplay", [resolvedPath], { stdio: "ignore" });
          return { success: true, path: resolvedPath, method: "aplay" };
        } catch {
          try {
            audioPlayer = spawn("paplay", [resolvedPath], { stdio: "ignore" });
            return { success: true, path: resolvedPath, method: "paplay" };
          } catch {
            audioPlayer = spawn("play", [resolvedPath], { stdio: "ignore" });
            return { success: true, path: resolvedPath, method: "play" };
          }
        }
      }

      // If all methods fail, return success anyway to avoid breaking the app
      console.warn("All audio playback methods failed, continuing silently");
      return {
        success: true,
        path: resolvedPath,
        method: "silent-fallback",
        warning: "Audio playback not available",
      };
    } catch (error: any) {
      console.error("Failed to play audio:", error);
      // Don't throw error to avoid breaking the app flow
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        fallback: true,
      };
    }
  }
);

ipcMain.handle("stop-audio", async () => {
  try {
    // Stop system audio player
    if (audioPlayer) {
      audioPlayer.kill();
      audioPlayer = null;
    }

    // Stop webContents audio
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        await mainWindow.webContents.executeJavaScript(`
          if (window.currentElectronAudio) {
            window.currentElectronAudio.pause();
            window.currentElectronAudio = null;
          }
        `);
      } catch (err) {
        console.warn("Failed to stop webContents audio:", err);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to stop audio:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

app.whenReady().then(async () => {
  await initializeModules();
  createWindow();
});

app.on("window-all-closed", () => {
  // Stop audio when app closes
  if (audioPlayer) {
    audioPlayer.kill();
    audioPlayer = null;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
