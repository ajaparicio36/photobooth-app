export interface Camera {
  model: string;
  port: string;
  id: string;
}

export interface CameraCapabilities {
  canCapture: boolean;
  canPreview: boolean;
  canRecord: boolean;
}

export interface CaptureOptions {
  format?: "jpeg" | "raw";
  quality?: number;
  outputPath?: string;
}

export interface FrameData {
  data: Buffer;
  width?: number;
  height?: number;
  timestamp: number;
}
