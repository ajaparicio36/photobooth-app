export interface SharpFilterOptions {
  brightness?: number;
  saturation?: number;
  hue?: number;
  contrast?: number;
  gamma?: number;
  tint?: {
    r: number;
    g: number;
    b: number;
  };
  blur?: number;
  grayscale?: boolean;
}

export interface CollageOptions {
  spacing?: number;
  backgroundColor?: string;
  logoPath?: string;
  logoPosition?:
    | "bottom-center"
    | "bottom-left"
    | "bottom-right"
    | "top-center";
  logoSize?: number;
}

export interface CollageResult {
  jpegPath: string;
  pdfPath: string;
}

export interface FilterResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

export interface AvailableFilter {
  key: string;
  name: string;
  description: string;
}
