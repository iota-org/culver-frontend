export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export interface UploadedAttachment {
  id: string;
  message_id: string;
  file_url: string;
  thumbnail_url: string | null;
  media_type: string;
  file_size_bytes: number;
  encrypted_key: string;
}

export interface PendingAttachment {
  /** Local-only id for tracking before upload completes */
  localId: string;
  file: File;
  /** Object URL for local preview */
  previewUrl: string;
  status: UploadStatus;
  progress: number; // 0–100
  error: string | null;
  /** Populated once upload succeeds */
  attachment: UploadedAttachment | null;
}

export interface AttachmentData {
  id: string;
  file_url: string;
  thumbnail_url: string | null;
  media_type: string;
  file_size_bytes: number;
  encrypted_key: string;
}
