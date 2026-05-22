import { X, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { PendingAttachment } from '../../types/media.ts';
import { formatBytes } from '../../lib/utils.ts';

interface AttachmentPreviewStripProps {
  pending: PendingAttachment[];
  onRemove: (localId: string) => void;
}

export default function AttachmentPreviewStrip({
  pending,
  onRemove,
}: AttachmentPreviewStripProps) {
  if (pending.length === 0) return null;

  return (
    <div className="px-4 pt-3 pb-0 flex gap-2 flex-wrap border-t border-border bg-card">
      {pending.map((item) => (
        <div
          key={item.localId}
          className="relative group flex flex-col items-center"
        >
          {/* Thumbnail or file icon */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border relative">
            {item.file.type.startsWith('image/') ? (
              <img
                src={item.previewUrl}
                alt={item.file.name}
                className="w-full h-full object-cover"
              />
            ) : item.file.type.startsWith('video/') ? (
              <video
                src={item.previewUrl}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <FileText className="w-7 h-7 text-muted-foreground" />
            )}

            {/* Upload progress overlay */}
            {item.status === 'uploading' && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
                <span className="text-white text-[10px] font-medium">
                  {item.progress}%
                </span>
              </div>
            )}

            {/* Done overlay */}
            {item.status === 'done' && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
            )}

            {/* Error overlay */}
            {item.status === 'error' && (
              <div className="absolute inset-0 bg-destructive/40 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive-foreground" />
              </div>
            )}
          </div>

          {/* File name + size */}
          <p className="mt-1 text-[10px] text-muted-foreground max-w-16 truncate text-center leading-tight">
            {item.file.name}
          </p>
          <p className="text-[9px] text-muted-foreground/70">
            {formatBytes(item.file.size)}
          </p>

          {/* Error tooltip */}
          {item.error && (
            <p className="absolute -bottom-5 left-0 text-[9px] text-destructive whitespace-nowrap max-w-32 truncate">
              {item.error}
            </p>
          )}

          {/* Remove button */}
          {item.status !== 'uploading' && (
            <button
              type="button"
              onClick={() => onRemove(item.localId)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-background border border-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
              aria-label={`Remove ${item.file.name}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
