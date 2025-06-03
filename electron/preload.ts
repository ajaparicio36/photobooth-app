import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Camera controls
  takePhoto: () => ipcRenderer.invoke("take-photo"),
  takeVideo: () => ipcRenderer.invoke("take-video"),

  // Image processing
  processImage: (imagePath: string, filters: any) =>
    ipcRenderer.invoke("process-image", imagePath, filters),

  // Printing
  printImages: (images: string[]) => ipcRenderer.invoke("print-images", images),

  // Cloud upload
  uploadToCloud: (images: string[]) =>
    ipcRenderer.invoke("upload-cloud", images),

  // File operations
  saveFile: (data: any, path: string) =>
    ipcRenderer.invoke("save-file", data, path),
});
