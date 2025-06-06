import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import { Printer, PrintOptions, PrintJob } from "../types/printer.type";

// Import printer with comprehensive error handling and fallback
let printer: any = null;
let printerAvailable = false;

async function initializePrinter(): Promise<void> {
  try {
    console.log("🖨️ Initializing printer module...");

    if (app.isPackaged) {
      // Simplified approach - try the most likely paths first
      const possiblePrinterPaths = [
        // ASAR unpacked is the most likely location for packaged apps
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "node_modules",
          "@grandchef",
          "node-printer"
        ),
        // Fallback paths
        path.join(
          process.resourcesPath,
          "node_modules",
          "@grandchef",
          "node-printer"
        ),
        path.join(
          __dirname,
          "..",
          "..",
          "node_modules",
          "@grandchef",
          "node-printer"
        ),
        path.join(process.cwd(), "node_modules", "@grandchef", "node-printer"),
      ];

      let printerLoaded = false;

      console.log("📍 Searching for printer module in packaged app...");

      for (const printerPath of possiblePrinterPaths) {
        try {
          console.log(`🔍 Trying printer path: ${printerPath}`);

          if (fs.existsSync(printerPath)) {
            console.log(`✅ Path exists: ${printerPath}`);

            // Try to require the module directly - let Node.js handle the binary loading
            try {
              // Clear require cache to force fresh load
              const moduleId = require.resolve(printerPath);
              if (require.cache[moduleId]) {
                delete require.cache[moduleId];
              }

              printer = require(printerPath);

              // Test the module immediately
              const testPrinters = printer.getPrinters();
              if (Array.isArray(testPrinters)) {
                console.log(
                  `✅ Printer loaded and tested successfully from: ${printerPath}`
                );
                printerLoaded = true;
                break;
              } else {
                throw new Error("getPrinters() returned invalid data");
              }
            } catch (loadError: unknown) {
              const errorMsg =
                loadError instanceof Error
                  ? loadError.message
                  : String(loadError);
              console.warn(
                `⚠️ Failed to load/test printer from ${printerPath}:`,
                errorMsg
              );

              if (errorMsg.includes("Module did not self-register")) {
                console.warn(
                  `💡 Binary compatibility issue detected for ${printerPath}`
                );
              }

              // Continue to next path
              printer = null;
            }
          } else {
            console.log(`❌ Path does not exist: ${printerPath}`);
          }
        } catch (pathError: unknown) {
          console.warn(
            `Failed to check printer path ${printerPath}:`,
            pathError instanceof Error ? pathError.message : String(pathError)
          );
        }
      }

      if (!printerLoaded) {
        throw new Error(
          "Could not load printer module from any expected location"
        );
      }
    } else {
      // Development mode - simpler approach
      console.log("🔧 Loading printer in development mode...");
      printer = require("@grandchef/node-printer");

      // Test the module
      const testPrinters = printer.getPrinters();
      if (!Array.isArray(testPrinters)) {
        throw new Error("Printer module test failed");
      }

      console.log("✅ Printer loaded in development");
    }

    // Final verification
    if (printer && typeof printer.getPrinters === "function") {
      printerAvailable = true;
      console.log("✅ Printer module initialization successful");
    } else {
      throw new Error(
        "Printer module loaded but getPrinters function not available"
      );
    }
  } catch (error) {
    console.error("❌ Failed to initialize printer module:", error);
    console.warn("🖨️ Printer features will run in mock mode");
    printer = null;
    printerAvailable = false;
  }
}

// Initialize when module loads
initializePrinter();

export class PrinterManager {
  private isPrinterAvailable: boolean;

  constructor() {
    this.isPrinterAvailable = printerAvailable;
    if (!this.isPrinterAvailable) {
      console.warn("Printer module not available. Running in mock mode.");
    }
  }

  async reinitializePrinter(): Promise<boolean> {
    console.log("🔄 Reinitializing printer module...");
    await initializePrinter();
    this.isPrinterAvailable = printerAvailable;

    if (printerAvailable) {
      console.log("✅ Printer reinitialization successful");
    } else {
      console.warn("⚠️ Printer reinitialization failed - staying in mock mode");
    }

    return printerAvailable;
  }

  async getAvailablePrinters(): Promise<Printer[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.isPrinterAvailable || !printer) {
          console.log("📋 Returning mock printer (module not available)");
          resolve([
            {
              name: "Mock Printer",
              displayName: "Mock Printer (Module Not Available)",
              status: "available",
              isDefault: true,
            },
          ]);
          return;
        }

        console.log("📋 Getting real printers...");
        const printers = printer.getPrinters();

        if (!Array.isArray(printers)) {
          throw new Error("getPrinters() returned invalid data");
        }

        const formattedPrinters: Printer[] = printers.map((p: any) => ({
          name: p.name,
          displayName: p.displayName || p.name,
          status: p.status || "unknown",
          isDefault: p.isDefault || false,
        }));

        console.log(`📊 Found ${formattedPrinters.length} real printers`);
        resolve(formattedPrinters);
      } catch (error) {
        console.error("Error getting printers:", error);

        // Try to reinitialize once on error
        this.reinitializePrinter().then((success) => {
          if (success) {
            // Retry once
            try {
              const printers = printer.getPrinters();
              const formattedPrinters: Printer[] = printers.map((p: any) => ({
                name: p.name,
                displayName: p.displayName || p.name,
                status: p.status || "unknown",
                isDefault: p.isDefault || false,
              }));
              resolve(formattedPrinters);
            } catch (retryError) {
              console.error("Retry also failed:", retryError);
              resolve([
                {
                  name: "Error Printer",
                  displayName: "Printer Error - Check Console",
                  status: "error",
                  isDefault: true,
                },
              ]);
            }
          } else {
            resolve([
              {
                name: "Error Printer",
                displayName: "Printer Error - Check Console",
                status: "error",
                isDefault: true,
              },
            ]);
          }
        });
      }
    });
  }

  async getDefaultPrinter(): Promise<Printer | null> {
    try {
      const printers = await this.getAvailablePrinters();
      return printers.find((p) => p.isDefault) || null;
    } catch (error) {
      console.error("Failed to get default printer:", error);
      return null;
    }
  }

  async printImage(
    imagePath: string,
    printerName?: string,
    options: PrintOptions = {}
  ): Promise<PrintJob> {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(imagePath)) {
          reject(new Error("Image file not found"));
          return;
        }

        const jobId = `job_${Date.now()}`;

        if (!this.isPrinterAvailable) {
          console.log(
            `[MOCK] Printing image ${imagePath} to ${
              printerName || "default printer"
            }`
          );
          setTimeout(() => {
            resolve({
              id: jobId,
              status: "completed",
            });
          }, 1000);
          return;
        }

        const printOptions: any = {};

        if (options.copies) {
          printOptions.copies = options.copies.toString();
        }
        if (options.paperSize) {
          printOptions["media-size"] = options.paperSize;
        }
        if (options.quality) {
          printOptions["print-quality"] = options.quality;
        }

        printer.printFile({
          filename: imagePath,
          printer: printerName,
          options: printOptions,
          success: () => {
            resolve({
              id: jobId,
              status: "completed",
            });
          },
          error: (err: any) => {
            reject({
              id: jobId,
              status: "error",
              error: err.message || "Print job failed",
            });
          },
        });
      } catch (error) {
        console.error("Print error:", error);
        const jobId = `job_${Date.now()}`;
        reject({
          id: jobId,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown print error",
        });
      }
    });
  }

  async printImages(
    imagePaths: string[],
    printerName?: string,
    options: PrintOptions = {}
  ): Promise<PrintJob[]> {
    const jobs: PrintJob[] = [];

    for (const imagePath of imagePaths) {
      try {
        const job = await this.printImage(imagePath, printerName, options);
        jobs.push(job);
      } catch (error) {
        jobs.push({
          id: `job_${Date.now()}`,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return jobs;
  }

  // Add a printer health check method
  async isPrinterModuleAvailable(): Promise<boolean> {
    return this.isPrinterAvailable;
  }
}

export const printerManager = new PrinterManager();
