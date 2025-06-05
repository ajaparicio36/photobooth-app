import { app, BrowserWindow } from "electron";
import { WindowManager } from "./services/window.manager";
import { ModuleInitializer } from "./services/module.initializer";
import { registerCameraHandlers } from "./handlers/camera.handlers";
import { registerPrinterHandlers } from "./handlers/printer.handlers";
import { registerSharpHandlers } from "./handlers/sharp.handlers";
import { registerFileHandlers } from "./handlers/file.handlers";
import { registerAudioHandlers, cleanupAudio } from "./handlers/audio.handlers";

app.commandLine.appendSwitch("disable-web-security");

let windowManager: WindowManager;
let moduleInitializer: ModuleInitializer;
let mainWindow: BrowserWindow;

async function initializeApp(): Promise<void> {
  try {
    moduleInitializer = new ModuleInitializer();
    await moduleInitializer.initializeModules();

    windowManager = new WindowManager();
    mainWindow = windowManager.createMainWindow();

    registerAllHandlers();
  } catch (error) {
    console.error("Failed to initialize app:", error);
  }
}

function registerAllHandlers(): void {
  registerCameraHandlers(mainWindow);
  registerPrinterHandlers();
  registerSharpHandlers();
  registerFileHandlers();
  registerAudioHandlers(mainWindow);
}

app.whenReady().then(initializeApp);

app.on("window-all-closed", () => {
  cleanupAudio();

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initializeApp();
  }
});
