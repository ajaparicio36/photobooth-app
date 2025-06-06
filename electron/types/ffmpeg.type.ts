export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
}

export interface FrameExtractionOptions {
  startTime?: number;
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
  format?: "jpg" | "png";
  quality?: number;
}

export interface FlipbookOptions {
  framesPerPage?: number; // Default: 9
  pageCount?: number; // Default: calculated from frames
  backgroundColor?: string;
  spacing?: number;
  aspectRatio?: number; // Default: 16/9
  logoPath?: string;
  logoSize?: number;
  filterName?: string; // Added for applying a Sharp filter to frames
}

export interface FlipbookResult {
  pages: string[]; // Array of page image paths
  pdfPath: string;
  frameCount: number;
  pageCount: number;
}

export interface FrameExtractionResult {
  frames: string[];
  totalFrames: number;
  videoInfo: VideoInfo;
}
