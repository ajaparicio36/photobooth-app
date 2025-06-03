import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { isDev } from "./util";

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
