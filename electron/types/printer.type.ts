export interface Printer {
  name: string;
  displayName: string;
  status: string;
  isDefault: boolean;
}

export interface PrintOptions {
  copies?: number;
  paperSize?: string;
  quality?: "draft" | "normal" | "high";
  orientation?: "portrait" | "landscape";
}

export interface PrintJob {
  id: string;
  status: "pending" | "printing" | "completed" | "error";
  error?: string;
}
