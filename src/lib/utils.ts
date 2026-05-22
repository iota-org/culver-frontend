// Media helpers

import type { MessageType } from '../types';

export function mimeToMessageType(
  mime: string,
): Extract<MessageType, 'image' | 'video' | 'audio' | 'file'> {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'file';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// String helpers 

export function getInitial(name: string | null | undefined): string {
  return (name ?? '?').charAt(0).toUpperCase();
}

export function hasLongToken(text: string | undefined, limit = 40): boolean {
  if (!text) return false;
  return text.split(/\s+/).some((t) => t.length > limit);
}

// Time helpers 

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
