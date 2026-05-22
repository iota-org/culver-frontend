import { useState, useRef, useCallback } from 'react';
import { auth } from '../lib/firebase';
import type {
  UploadedAttachment,
  PendingAttachment,
  UploadStatus,
} from '../types/media';
import { API_BASE_URL, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../constants';

export function useMediaUpload() {
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const abortControllers = useRef<Record<string, AbortController>>({});

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return `File type "${file.type}" is not supported.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is 50 MB.`;
    }
    return null;
  };

  // Add files
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const next: PendingAttachment[] = arr.map((file) => {
      const validationError = validateFile(file);
      return {
        localId: `local-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: (validationError ? 'error' : 'idle') as UploadStatus,
        progress: 0,
        error: validationError,
        attachment: null,
      };
    });

    setPending((prev) => [...prev, ...next]);
    return next;
  }, []);

  // Remove a pending attachment

  const removeFile = useCallback((localId: string) => {
    abortControllers.current[localId]?.abort();
    delete abortControllers.current[localId];
    setPending((prev) => {
      const item = prev.find((p) => p.localId === localId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.localId !== localId);
    });
  }, []);

  // Clear all (call after message is sent)

  const clearAll = useCallback(() => {
    setPending((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    abortControllers.current = {};
  }, []);

  // Upload a single file to POST /api/v1/media/upload

  const uploadFile = useCallback(
    async (
      localId: string,
      messageId: string,
    ): Promise<UploadedAttachment | null> => {
      const item = pending.find((p) => p.localId === localId);
      if (!item || item.status === 'error') return null;

      const controller = new AbortController();
      abortControllers.current[localId] = controller;

      setPending((prev) =>
        prev.map((p) =>
          p.localId === localId
            ? { ...p, status: 'uploading', progress: 0 }
            : p,
        ),
      );

      try {
        // Get Firebase auth token
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');
        const token = await currentUser.getIdToken();

        // Build FormData
        // encrypted_key is a placeholder — swap for real E2E key when encryption lands
        const encrypted_key = `placeholder-key-${localId}`;
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('message_id', messageId);
        formData.append('encrypted_key', encrypted_key);

        // Use XMLHttpRequest for real progress events
        const result = await new Promise<UploadedAttachment>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                setPending((prev) =>
                  prev.map((p) =>
                    p.localId === localId ? { ...p, progress: pct } : p,
                  ),
                );
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const json = JSON.parse(xhr.responseText) as {
                    data: UploadedAttachment;
                  };
                  resolve(json.data);
                } catch {
                  reject(new Error('Invalid response from server'));
                }
              } else {
                let msg = `Upload failed (${xhr.status})`;
                try {
                  const err = JSON.parse(xhr.responseText) as {
                    message?: string;
                  };
                  if (err.message) msg = err.message;
                } catch {
                  /* ignore */
                }
                reject(new Error(msg));
              }
            });

            xhr.addEventListener('error', () =>
              reject(new Error('Network error during upload')),
            );
            xhr.addEventListener('abort', () =>
              reject(new Error('Upload cancelled')),
            );

            controller.signal.addEventListener('abort', () => xhr.abort());

            xhr.open('POST', `${API_BASE_URL}/api/v1/media/upload`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
          },
        );

        setPending((prev) =>
          prev.map((p) =>
            p.localId === localId
              ? { ...p, status: 'done', progress: 100, attachment: result }
              : p,
          ),
        );

        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        // Don't mark as error if it was intentionally aborted
        if (msg !== 'Upload cancelled') {
          setPending((prev) =>
            prev.map((p) =>
              p.localId === localId ? { ...p, status: 'error', error: msg } : p,
            ),
          );
        }
        return null;
      } finally {
        delete abortControllers.current[localId];
      }
    },
    [pending],
  );

  // Upload all idle/error-retryable files

  const uploadAll = useCallback(
    async (messageId: string): Promise<UploadedAttachment[]> => {
      const toUpload = pending.filter((p) => p.status === 'idle');
      const results = await Promise.all(
        toUpload.map((p) => uploadFile(p.localId, messageId)),
      );
      return results.filter(Boolean) as UploadedAttachment[];
    },
    [pending, uploadFile],
  );

  // Helpers

  const hasFiles = pending.length > 0;
  const isUploading = pending.some((p) => p.status === 'uploading');
  const allDone =
    pending.length > 0 &&
    pending.every((p) => p.status === 'done' || p.status === 'error');
  const readyToSend =
    pending.length > 0 &&
    pending.every((p) => p.status === 'idle' || p.status === 'done');

  return {
    pending,
    hasFiles,
    isUploading,
    allDone,
    readyToSend,
    addFiles,
    removeFile,
    clearAll,
    uploadFile,
    uploadAll,
  };
}
