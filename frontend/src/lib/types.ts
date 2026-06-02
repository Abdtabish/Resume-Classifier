export type ResumeResultStatus = "processed" | "failed" | "queued";

export type ResumeResult = {
  fileName: string;
  prediction: string;
  confidence: number; // 0..100
  textPreview: string;
  status: ResumeResultStatus | string;
  error?: string;
};

export type ClassifyResponse = {
  results: ResumeResult[];
};

export type UploadItemStatus =
  | "queued"
  | "ready"
  | "uploading"
  | "processed"
  | "failed"
  | "invalid";

export type UploadItem = {
  id: string;
  file: File;
  status: UploadItemStatus;
  error?: string;
};

