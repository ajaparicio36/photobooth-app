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

export enum PaperType {
  TwoBySix = "2x6",
  FourBySix = "4x6",
}

export const PAPER_TYPE_PHOTO_COUNT = {
  [PaperType.TwoBySix]: 2, // Sharp handles duplication internally
  [PaperType.FourBySix]: 4,
};

export interface CollageOptions {
  spacing?: number; // Default: 10px for A6
  backgroundColor?: string;
  logoPath?: string;
  logoPosition?:
    | "bottom-center"
    | "bottom-left"
    | "bottom-right"
    | "top-center";
  paperType?: PaperType; // Default: A6
  logoSize?: number; // Default: 60px for A6
  paperSize?: "A6" | "A5" | "A4"; // Default: A6
  orientation?: "portrait" | "landscape"; // Default: portrait for A6
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
