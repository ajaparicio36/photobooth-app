import { ipcMain } from "electron";
import { printerManager } from "../utils/printer";

export function registerPrinterHandlers() {
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

  ipcMain.handle("check-printer-health", async () => {
    try {
      return await printerManager.isPrinterModuleAvailable();
    } catch (error) {
      return false;
    }
  });
}
