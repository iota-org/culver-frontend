import { useCallback, useEffect, useState } from 'react';
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import { formatBytes } from '../../lib/utils';
import { getAttachment } from '../../services/mediaService';
import type { AttachmentData } from '../../types/media';

interface MessageAttachmentProps {
  /** The raw ciphertext from the message — we store the attachment id here */
  attachmentId: string;
  /** Hints for rendering — from message.message_type */
  mediaType: 'image' | 'video' | 'audio' | 'file';
  /** Initial data if already embedded in the message payload */
  initialData?: AttachmentData | null;
  isOwn: boolean;
}

export default function MessageAttachment({
  attachmentId,
  mediaType,
  initialData,
  isOwn,
}: MessageAttachmentProps) {
  const [data, setData] = useState<
    (AttachmentData & { signed_url?: string }) | null
  >(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Lazily fetch attachment metadata + signed URL on first render
  const fetchAttachment = useCallback(async () => {
    if (data?.signed_url) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getAttachment(attachmentId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load attachment',
      );
    } finally {
      setLoading(false);
    }
  }, [attachmentId, data?.signed_url]);

  useEffect(() => {
    if (!data) queueMicrotask(() => void fetchAttachment());
  }, [data, fetchAttachment]);

  const url = data?.signed_url ?? data?.file_url ?? '';
  const thumbnail = data?.thumbnail_url;
  const filename = url.split('/').pop()?.split('?')[0] ?? 'file';
  const fileSize = data?.file_size_bytes ?? 0;

  // Loading 

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-1">
        <Loader2 className="w-4 h-4 animate-spin opacity-60" />
        <span className="text-xs opacity-60">Loading…</span>
      </div>
    );
  }

  // Error

  if (error) {
    return (
      <div className="flex items-center gap-2 py-1">
        <AlertCircle className="w-4 h-4 text-destructive" />
        <span className="text-xs opacity-70">{error}</span>
        <button
          onClick={() => void fetchAttachment()}
          className="text-xs underline opacity-70 hover:opacity-100"
        >
          Retry
        </button>
      </div>
    );
  }

  // Image 

  if (mediaType === 'image') {
    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="block max-w-xs rounded-xl overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="View full image"
        >
          <img
            src={thumbnail ?? url}
            alt="Shared image"
            className="w-full max-h-64 object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '';
              e.currentTarget.parentElement?.classList.add('broken');
            }}
            loading="lazy"
          />
        </button>

        {/* Lightbox */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <img
              src={url}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <a
              href={url}
              download
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-16 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
              aria-label="Download"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
      </>
    );
  }

  // Video

  if (mediaType === 'video') {
    return (
      <div className="max-w-xs rounded-xl overflow-hidden">
        <video
          src={url}
          poster={thumbnail ?? undefined}
          controls
          className="w-full max-h-64 bg-black"
          preload="metadata"
        />
      </div>
    );
  }

  // File (PDF, DOC, etc.)

  return (
    <a
      href={url}
      download={filename}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-3 rounded-xl border max-w-xs transition-colors ${
        isOwn
          ? 'border-white/20 hover:bg-white/10'
          : 'border-border hover:bg-accent'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isOwn ? 'bg-white/20' : 'bg-muted'
        }`}
      >
        {data?.media_type === 'application/pdf' ? (
          <FileText className="w-5 h-5 text-red-400" />
        ) : (
          <FileText className="w-5 h-5 text-blue-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{filename}</p>
        {fileSize > 0 && (
          <p
            className={`text-xs mt-0.5 ${isOwn ? 'opacity-70' : 'text-muted-foreground'}`}
          >
            {formatBytes(fileSize)}
          </p>
        )}
      </div>
      <Download className="w-4 h-4 shrink-0 opacity-60" />
    </a>
  );
}
