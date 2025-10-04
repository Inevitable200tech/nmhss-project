// memoryUploads.ts

export type PendingMedia = {
  tempId: string; // Unique temp ID
  file: Buffer;
  mimeType: string;
  filename: string;
  type: "image" | "video";
  batch: "+1" | "+2";
  year: number;
  description?: string;
};

export const pendingUploads = new Map<string, PendingMedia>();
