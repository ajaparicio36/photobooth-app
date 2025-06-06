import { BrowserWindow, app } from "electron";
import * as path from "path";
import * as fs from "fs";
import { isDev, isTestingProd } from "../util";

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  createMainWindow(): BrowserWindow {
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("isDev:", isDev);
    console.log("isTestingProd:", isTestingProd);
    console.log("app.isPackaged:", app.isPackaged);

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "../preload.js"),
        webSecurity: false,
      },
      show: false,
      autoHideMenuBar: true,
    });

    this.setupWindowEvents();
    this.loadContent();

    return this.mainWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  private setupWindowEvents(): void {
    if (!this.mainWindow) return;

    this.mainWindow.once("ready-to-show", () => {
      console.log("Window ready to show");
      this.mainWindow?.show();

      if (isDev || isTestingProd) {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    this.mainWindow.webContents.on(
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

    this.mainWindow.webContents.on(
      "console-message",
      (event, level, message, line, sourceId) => {
        console.log(`Console [${level}]:`, message);
        if (line && sourceId) {
          console.log(`  at ${sourceId}:${line}`);
        }
      }
    );
  }

  private loadContent(): void {
    if (!this.mainWindow) return;

    if (isDev) {
      this.loadDevelopmentContent();
    } else {
      this.loadProductionContent();
    }
  }

  private loadDevelopmentContent(): void {
    if (!this.mainWindow) return;

    console.log("Loading development server...");
    this.mainWindow.loadURL("http://localhost:5173").catch((err) => {
      console.error("Failed to load dev server:", err);
      this.showErrorPage("Development Server Not Running", [
        "Please start the Vite dev server with: <code>npm run dev</code>",
        "Then restart Electron with: <code>npm run electron:dev</code>",
        "<strong>Make sure both commands are running in separate terminals!</strong>",
      ]);
    });
    this.mainWindow.webContents.openDevTools();
  }

  private loadProductionContent(): void {
    if (!this.mainWindow) return;

    console.log("Loading production build...");

    // Fix the path - should be dist-electron/dist, not just dist
    const localDistPath = path.join(__dirname, "../../dist/index.html");
    console.log("Testing production build at:", localDistPath);

    if (fs.existsSync(localDistPath)) {
      this.loadProductionFile(localDistPath);
      return;
    }

    if (app.isPackaged) {
      this.loadPackagedContent();
    } else {
      this.showProductionBuildMissingError(localDistPath);
    }
  }

  private loadProductionFile(filePath: string): void {
    if (!this.mainWindow) return;

    console.log("Loading production build from:", filePath);
    this.mainWindow.loadFile(filePath).catch((err) => {
      console.error("Failed to load production build:", err);
      this.showErrorPage("Production Build Error", [
        `Failed to load: ${filePath}`,
        `Error: ${err.message}`,
        "Check the console for more details.",
      ]);
    });
  }

  private loadPackagedContent(): void {
    if (!this.mainWindow) return;

    const possiblePaths = [
      path.join(app.getAppPath(), "dist/index.html"),
      path.join(process.resourcesPath, "app/dist/index.html"),
      path.join(process.resourcesPath, "dist/index.html"),
      path.join(__dirname, "../../dist/index.html"), // Updated path
      path.join(__dirname, "../../../dist/index.html"), // Additional fallback
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
      this.loadProductionFile(indexPath);
    } else {
      this.showPackagedBuildMissingError(possiblePaths);
    }
  }

  private showErrorPage(title: string, messages: string[]): void {
    if (!this.mainWindow) return;

    const messageList = messages.map((msg) => `<p>${msg}</p>`).join("");
    const html = `
      <html>
        <body style="font-family: Arial; padding: 20px;">
          <h1>${title}</h1>
          ${messageList}
        </body>
      </html>
    `;

    this.mainWindow.loadURL(`data:text/html;charset=utf-8,${html}`);
  }

  private showProductionBuildMissingError(localDistPath: string): void {
    this.showErrorPage("Production Build Missing", [
      `No production build found at: ${localDistPath}`,
      "Please run the following commands:",
      "<ol><li><code>bun run build</code> - Build the frontend</li><li><code>npm run test:prod</code> - Test production build</li></ol>",
      "Or run <code>npm run debug:build</code> to see what files are generated.",
    ]);
  }

  private showPackagedBuildMissingError(possiblePaths: string[]): void {
    console.error("Could not find index.html in packaged app");
    console.log("Searched paths:", possiblePaths);

    possiblePaths.forEach((testPath) => {
      const dir = path.dirname(testPath);
      if (fs.existsSync(dir)) {
        console.log(`Contents of ${dir}:`, fs.readdirSync(dir));
      } else {
        console.log(`Directory does not exist: ${dir}`);
      }
    });

    this.showErrorPage("Packaged Build Missing", [
      "The application build files were not found in the packaged app.",
      "Please ensure the build completed successfully before packaging.",
      "<h3>Debug Info:</h3>",
      `<p>isPackaged: ${app.isPackaged}</p>`,
      `<p>getAppPath: ${app.getAppPath()}</p>`,
      `<p>resourcesPath: ${process.resourcesPath}</p>`,
      `<p>__dirname: ${__dirname}</p>`,
    ]);
  }
}
