import { ipcMain } from "electron";
import { printerManager } from "../utils/printer";

export function registerPrinterHandlers() {
  ipcMain.handle("get-available-printers", async () => {
    try {
      // Try to reinitialize if not available
      if (!(await printerManager.isPrinterModuleAvailable())) {
        console.log(
          "Printer module not available, attempting to reinitialize..."
        );
        await printerManager.reinitializePrinter();
      }

      return await printerManager.getAvailablePrinters();
    } catch (error) {
      console.error("Failed to get printers:", error);
      // Return mock printer instead of throwing
      return [
        {
          name: "Mock Printer",
          displayName: "Mock Printer (Module Error)",
          status: "error",
          isDefault: true,
        },
      ];
    }
  });

  ipcMain.handle("get-default-printer", async () => {
    try {
      return await printerManager.getDefaultPrinter();
    } catch (error) {
      console.error("Failed to get default printer:", error);
      return {
        name: "Mock Printer",
        displayName: "Mock Printer (Module Error)",
        status: "error",
        isDefault: true,
      };
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

  ipcMain.handle("check-printer-health", async () => {
    try {
      const available = await printerManager.isPrinterModuleAvailable();
      if (!available) {
        // Try to reinitialize
        const reinitResult = await printerManager.reinitializePrinter();
        return reinitResult;
      }
      return available;
    } catch (error) {
      console.error("Printer health check failed:", error);
      return false;
    }
  });
}
