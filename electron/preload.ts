import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Camera controls
  getAvailableCameras: () => ipcRenderer.invoke("get-available-cameras"),
  captureImage: (outputPath: string, options?: any) =>
    ipcRenderer.invoke("capture-image", outputPath, options),
  startPreview: (callback: (frame: any) => void) => {
    ipcRenderer.on("camera-frame", (_, frame) => callback(frame));
    return ipcRenderer.invoke("start-preview");
  },
  stopPreview: () => ipcRenderer.invoke("stop-preview"),
  checkCameraHealth: () => ipcRenderer.invoke("check-camera-health"),

  // Legacy camera methods
  takePhoto: () => ipcRenderer.invoke("take-photo"),
  takeVideo: () => ipcRenderer.invoke("take-video"),

  // Printer controls
  getAvailablePrinters: () => ipcRenderer.invoke("get-available-printers"),
  getDefaultPrinter: () => ipcRenderer.invoke("get-default-printer"),
  printImage: (imagePath: string, printerName?: string, options?: any) =>
    ipcRenderer.invoke("print-image", imagePath, printerName, options),
  checkPrinterHealth: () => ipcRenderer.invoke("check-printer-health"),

  // Image processing
  processImage: (imagePath: string, filters: any) =>
    ipcRenderer.invoke("process-image", imagePath, filters),

  // Printing (legacy)
  printImages: (images: string[]) => ipcRenderer.invoke("print-images", images),

  // Cloud upload
  uploadToCloud: (images: string[]) =>
    ipcRenderer.invoke("upload-cloud", images),

  // File operations
  saveFile: (data: any, path: string) =>
    ipcRenderer.invoke("save-file", data, path),
});
