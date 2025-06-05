import { ipcMain } from "electron";
import { sharpManager } from "../utils/sharp";

export function registerSharpHandlers() {
  ipcMain.handle(
    "apply-image-filter",
    async (_, imagePath: string, filterName: string, outputPath: string) => {
      try {
        return await sharpManager.applyFilter(
          imagePath,
          filterName,
          outputPath
        );
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
        const result = await sharpManager.buildCollage(
          imagePaths,
          outputPath,
          options
        );
        // Return both JPEG and PDF paths for frontend use
        return {
          success: true,
          jpegPath: result.jpegPath,
          pdfPath: result.pdfPath,
          previewPath: result.jpegPath, // Explicitly provide preview path
        };
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
}
