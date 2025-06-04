export interface ElectronAPI {
  // Camera controls
  getAvailableCameras: () => Promise<any[]>;
  captureImage: (outputPath: string, options?: any) => Promise<string>;
  startPreview: (
    callback: (frame: any) => void
  ) => Promise<{ success: boolean }>;
  stopPreview: () => Promise<{ success: boolean }>;
  checkCameraHealth: () => Promise<boolean>;

  // Legacy camera methods
  takePhoto: () => Promise<any>;
  takeVideo: () => Promise<any>;

  // Printer controls
  getAvailablePrinters: () => Promise<any[]>;
  getDefaultPrinter: () => Promise<any>;
  printImage: (
    imagePath: string,
    printerName?: string,
    options?: any
  ) => Promise<any>;
  checkPrinterHealth: () => Promise<boolean>;

  // Image processing
  processImage: (imagePath: string, filters: any) => Promise<any>;

  // Printing (legacy)
  printImages: (images: string[]) => Promise<any>;

  // Cloud upload
  uploadToCloud: (images: string[]) => Promise<any>;

  // File operations
  saveFile: (
    data: any,
    path: string
  ) => Promise<{ success: boolean; path: string }>;
  readFile: (path: string) => Promise<Buffer>;
  createTempFile: (
    data: any,
    extension: string
  ) => Promise<{ success: boolean; path: string }>;
  cleanupTempFiles: () => Promise<{ success: boolean }>;

  // Image processing with Sharp
  applyImageFilter: (
    imagePath: string,
    filterName: string,
    outputPath: string
  ) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  applyCustomImageFilter: (
    imagePath: string,
    options: any,
    outputPath: string
  ) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  getAvailableImageFilters: () => Promise<
    Array<{
      key: string;
      name: string;
      description: string;
    }>
  >;
  getImageFilterInfo: (filterName: string) => Promise<{
    key: string;
    name: string;
    description: string;
  } | null>;

  // Collage functionality
  buildCollage: (
    imagePaths: string[],
    outputPath: string,
    options?: any
  ) => Promise<{ jpegPath: string; pdfPath: string }>;
  generatePrintPDF: (
    imagePaths: string[],
    outputPath: string,
    options?: any
  ) => Promise<{ jpegPath: string; pdfPath: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
