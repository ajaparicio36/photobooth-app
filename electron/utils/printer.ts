import * as printer from "@grandchef/node-printer";
import * as fs from "fs";
import { Printer, PrintOptions, PrintJob } from "../types/printer.type";

export class PrinterManager {
  async getAvailablePrinters(): Promise<Printer[]> {
    return new Promise((resolve, reject) => {
      try {
        const printers = printer.getPrinters();
        const formattedPrinters: Printer[] = printers.map((p: any) => ({
          name: p.name,
          displayName: p.displayName || p.name,
          status: p.status || "unknown",
          isDefault: p.isDefault || false,
        }));
        resolve(formattedPrinters);
      } catch (error) {
        reject(error);
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
        reject(error);
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
}

export const printerManager = new PrinterManager();
