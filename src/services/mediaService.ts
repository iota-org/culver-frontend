import { apiClient } from '../lib/api';
import type { AttachmentData } from '../types/media';

export type AttachmentWithSignedUrl = AttachmentData & { signed_url: string };

export async function getAttachment(
  attachmentId: string,
): Promise<AttachmentWithSignedUrl> {
  const response = await apiClient.get<{ data: AttachmentWithSignedUrl }>(
    `/media/${attachmentId}`,
  );
  return response.data.data;
}
