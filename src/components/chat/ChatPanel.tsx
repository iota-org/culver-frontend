import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  Check,
  Pause,
  Trash,
  Play,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useConversations } from '../../contexts/ConversationsContext';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { mimeToMessageType } from '../../lib/utils';
import AttachmentPreviewStrip from './AttachmentPreviewStrip';
import MessageAttachment from './MessageAttachment';
import { createMessage } from '../../services/conversationsService';

type ChatPanelProps = {
  toggleContactInfo: () => void;
};

export default function ChatPanel({ toggleContactInfo }: ChatPanelProps) {
  const { user } = useAuth();
  const {
    selectedConversation,
    messages,
    sendMessage,
    markAsRead,
    setSelectedConversation,
    typingUsers,
    emitTypingStart,
    emitTypingStop,
    isLoadingMessages,
    hasMoreMessages,
    loadMoreMessages,
  } = useConversations();

  const {
    pending,
    hasFiles,
    isUploading,
    addFiles,
    removeFile,
    clearAll,
    uploadFile,
  } = useMediaUpload();

  const [inputValue, setInputValue] = useState('');
  const typingTimeoutRef = useRef<number | null>(null);
  const [chatMode, setChatMode] = useState<'chat' | 'voice'>('chat');
  const [recordingState, setRecordingState] = useState<
    null | 'recording' | 'paused'
  >(null);
  const [recordingPreview, setRecordingPreview] = useState<
    'active' | 'inactive'
  >('inactive');
  const [recordingTimeSeconds, setRecordingTimeSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSendingMedia, setIsSendingMedia] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const recordingTickRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeVoiceMessageId, setActiveVoiceMessageId] = useState<
    string | null
  >(null);
  const [voiceProgress, setVoiceProgress] = useState<Record<string, number>>(
    {},
  );
  const [voiceDurations, setVoiceDurations] = useState<Record<string, number>>(
    {},
  );

  const conversationMessages = useMemo(
    () =>
      selectedConversation ? (messages[selectedConversation.id] ?? []) : [],
    [selectedConversation, messages],
  );

  const latestMessage = conversationMessages[conversationMessages.length - 1];

  const currentTypingUsers = useMemo(() => {
    if (!selectedConversation) return [];
    return typingUsers[selectedConversation.id] ?? [];
  }, [typingUsers, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  useEffect(() => {
    if (!selectedConversation || !latestMessage) return;
    if (latestMessage.sender_id !== user?.id) {
      markAsRead(selectedConversation.id, latestMessage.id);
    }
  }, [latestMessage, markAsRead, selectedConversation, user?.id]);

  // Recording helper functions

  const stopRecordingTimer = () => {
    if (recordingTickRef.current !== null) {
      window.clearInterval(recordingTickRef.current);
      recordingTickRef.current = null;
    }
  };

  const releaseMicrophone = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const hasLongToken = (text: string | undefined, limit = 40) => {
    if (!text) return false;
    return text.split(/\s+/).some((t) => t.length > limit);
  };

  const pauseAllVoiceMessages = (exceptMessageId?: string) => {
    Object.entries(voiceAudioRefs.current).forEach(([messageId, audio]) => {
      if (!audio || (exceptMessageId && messageId === exceptMessageId)) return;
      if (!audio.paused) audio.pause();
    });
  };

  const toggleVoiceMessagePlayback = async (messageId: string) => {
    const audio = voiceAudioRefs.current[messageId];
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      setActiveVoiceMessageId(null);
      return;
    }
    pauseAllVoiceMessages(messageId);
    if (audio.duration && audio.currentTime >= audio.duration - 0.05) {
      audio.currentTime = 0;
      setVoiceProgress((prev) => ({ ...prev, [messageId]: 0 }));
    }
    try {
      await audio.play();
      setActiveVoiceMessageId(messageId);
    } catch {
      setActiveVoiceMessageId(null);
    }
  };

  const handleVoiceSeek = (messageId: string, value: number) => {
    const audio = voiceAudioRefs.current[messageId];
    if (!audio) return;
    const clamped = Math.max(0, Math.min(100, value));
    const duration = audio.duration || voiceDurations[messageId] || 0;
    audio.currentTime = duration * (clamped / 100);
    setVoiceProgress((prev) => ({ ...prev, [messageId]: clamped }));
  };

  // File picker

  const handleFilePickerClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // Reset so same file can be picked again
    e.target.value = '';
  };

  // Drag-and-drop onto the messages area
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Send text

  const handleSendText = () => {
    if (!inputValue.trim() || !selectedConversation) return;
    sendMessage(selectedConversation.id, inputValue.trim(), 'text');
    setInputValue('');
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    emitTypingStop(selectedConversation.id);
  };

  // Send media attachments
  //
  // steps
  // 1. Create a placeholder message via socket (message_type = first file's type)
  //    to get a real message_id from the backend.
  // 2. Upload all files to POST /api/v1/media/upload using that message_id.
  // 3. The backend links the attachment rows to the message_id automatically.
  // 4. Update the optimistic message in-place (socket ack handles this).
  //
  // If the user also typed text, send it as a separate text message after.

  const handleSendMedia = async () => {
    if (!selectedConversation || pending.length === 0) return;
    setIsSendingMedia(true);
    setErrorMessage(null);

    try {
      // We need a real message_id before uploading.
      // Send a placeholder message via the REST API (not socket) to get the id.
      const firstFile = pending[0];
      const firstType = mimeToMessageType(firstFile.file.type);

      // POST /conversations/:id/messages to create the message row
      const placeholderMessage = await createMessage(
        selectedConversation.id,
        inputValue.trim() || firstFile.file.name,
        firstType,
      );

      const messageId = placeholderMessage.id;

      // Upload all pending files against that message_id
      const uploadResults = await Promise.all(
        pending.map((p) => uploadFile(p.localId, messageId)),
      );

      const successful = uploadResults.filter(Boolean);
      if (successful.length === 0) {
        throw new Error('All uploads failed. Please try again.');
      }

      // The message already exists on the server — fire the socket event
      // so the rest of the conversation UI updates (optimistic + sidebar preview).
      // Use the file_url of the first attachment as ciphertext so existing
      // voice/image renderers can use it directly.
      sendMessage(selectedConversation.id, successful[0]!.file_url, firstType);

      // If user also typed text, send as a separate message
      if (inputValue.trim()) {
        sendMessage(selectedConversation.id, inputValue.trim(), 'text');
        setInputValue('');
      }

      clearAll();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to send media',
      );
    } finally {
      setIsSendingMedia(false);
    }
  };

  // Send voice

  const handleSendVoice = () => {
    if (!selectedConversation || !recordedAudioUrl) return;
    sendMessage(selectedConversation.id, recordedAudioUrl, 'audio');
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    setRecordedAudioUrl(null);
    setRecordingTimeSeconds(0);
    setRecordingState(null);
    setRecordingPreview('inactive');
    setChatMode('chat');
    setErrorMessage(null);
  };

  // Recording flow

  const startVoiceRecording = async () => {
    if (!selectedConversation) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setErrorMessage('Voice recording is not supported in this browser.');
      return;
    }
    try {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
      setErrorMessage(null);
      setRecordingTimeSeconds(0);
      setRecordingPreview('inactive');
      recordedChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: 'audio/webm',
        });
        if (audioBlob.size === 0) {
          setErrorMessage('No audio was captured. Please try again.');
          return;
        }
        setRecordedAudioUrl(URL.createObjectURL(audioBlob));
        setRecordingState('paused');
        setRecordingPreview('inactive');
      };

      mediaRecorder.start(300);
      setChatMode('voice');
      setRecordingState('recording');
      stopRecordingTimer();
      recordingTickRef.current = window.setInterval(() => {
        setRecordingTimeSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setErrorMessage('Unable to access microphone. Please check permissions.');
      setChatMode('chat');
      setRecordingState(null);
      releaseMicrophone();
      stopRecordingTimer();
    }
  };

  const resumeVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;
    recorder.resume();
    setRecordingState('recording');
    stopRecordingTimer();
    recordingTickRef.current = window.setInterval(() => {
      setRecordingTimeSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    setRecordingState('paused');
    stopRecordingTimer();
    releaseMicrophone();
  };

  const discardVoiceRecording = () => {
    stopRecordingTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    releaseMicrophone();
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    setRecordedAudioUrl(null);
    setRecordingTimeSeconds(0);
    setRecordingState(null);
    setRecordingPreview('inactive');
    setChatMode('chat');
    setErrorMessage(null);
  };

  // Input & keyboard

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!selectedConversation) return;
    emitTypingStart(selectedConversation.id);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      emitTypingStop(selectedConversation.id);
    }, 3000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasFiles) {
      void handleSendMedia();
    } else if (chatMode === 'chat') {
      handleSendText();
    } else {
      handleSendVoice();
    }
  };

  const chatButtonEvents = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && chatMode === 'voice') discardVoiceRecording();
    if (e.key === 'Enter' && chatMode === 'voice') handleSendVoice();
    if (e.key === 'Enter' && chatMode === 'chat' && !e.shiftKey) {
      e.preventDefault();
      if (hasFiles) void handleSendMedia();
      else handleSendText();
    }
    if (e.key === 'Enter' && chatMode === 'chat' && e.shiftKey) {
      e.preventDefault();
      setInputValue((prev) => prev + '\n');
    }
    if (e.key === 'Escape' && chatMode === 'chat' && !hasFiles) {
      setInputValue('');
      setSelectedConversation(null);
    }
  };

  // Cleanup

  useEffect(() => {
    return () => {
      stopRecordingTimer();
      releaseMicrophone();
      if (typingTimeoutRef.current)
        window.clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (recordingPreview === 'active') {
      previewAudioRef.current
        ?.play()
        .catch(() => setRecordingPreview('inactive'));
    } else {
      previewAudioRef.current?.pause();
    }
  }, [recordingPreview]);

  useEffect(() => {
    pauseAllVoiceMessages();
    const t = window.setTimeout(() => setActiveVoiceMessageId(null), 0);
    return () => window.clearTimeout(t);
  }, [selectedConversation?.id]);

  // Derived send-button state

  const canSend = hasFiles
    ? !isUploading && !isSendingMedia
    : chatMode === 'chat'
      ? !!inputValue.trim()
      : !!recordedAudioUrl;

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3>Select a conversation</h3>
          <p className="text-muted-foreground mt-2">
            Choose a conversation from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }

  const displayName = selectedConversation.name ?? 'Unknown';

  // Render

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,audio/webm,audio/mpeg,audio/ogg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleFileInputChange}
        aria-label="Attach files"
      />

      {/* Header */}
      <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
        <div
          className="flex items-center gap-3 p-2 pr-24 hover:bg-sidebar-accent rounded-lg cursor-pointer transition-colors"
          onClick={toggleContactInfo}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
              {selectedConversation.avatar_url ? (
                <img
                  src={selectedConversation.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-foreground font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-medium w-auto">{displayName}</h3>
            <p className="text-xs text-muted-foreground">
              {selectedConversation.type === 'group'
                ? 'Group conversation'
                : 'Direct message'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-foreground" />
          </button>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Video className="w-5 h-5 text-foreground" />
          </button>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="max-w-full flex-1 p-6 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-400 overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-[3px]"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {hasMoreMessages(selectedConversation.id) && (
          <div className="flex justify-center">
            <button
              onClick={() => void loadMoreMessages(selectedConversation.id)}
              disabled={isLoadingMessages}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <ChevronUp className="w-4 h-4" />
              {isLoadingMessages ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {conversationMessages.length === 0 && !isLoadingMessages ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          conversationMessages.map((msg, idx) => {
            const isOwn = msg.sender_id === user?.id;
            const showTimestamp =
              idx === 0 ||
              (conversationMessages[idx - 1] &&
                msg.sent_at.getTime() -
                  conversationMessages[idx - 1].sent_at.getTime() >
                  300_000);

            return (
              <div key={msg.id}>
                {showTimestamp && (
                  <div className="text-center text-xs text-muted-foreground my-4">
                    {format(msg.sent_at, 'EEEE, MMM d, h:mm a')}
                  </div>
                )}
                <div
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] min-w-0 rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-message-sent text-white'
                        : 'bg-message-received text-foreground'
                    }`}
                  >
                    {/* ── Audio message ───────────────────────────────────── */}
                    {msg.message_type === 'audio' ? (
                      <div className="min-w-55 flex items-center gap-3">
                        <audio
                          ref={(el) => {
                            voiceAudioRefs.current[msg.id] = el;
                          }}
                          src={msg.ciphertext}
                          preload="metadata"
                          className="hidden"
                          onLoadedMetadata={(e) => {
                            const duration = Math.floor(
                              e.currentTarget.duration || 0,
                            );
                            setVoiceDurations((prev) => ({
                              ...prev,
                              [msg.id]: duration,
                            }));
                          }}
                          onTimeUpdate={(e) => {
                            const { currentTime, duration } = e.currentTarget;
                            const progress =
                              duration > 0 ? (currentTime / duration) * 100 : 0;
                            setVoiceProgress((prev) => ({
                              ...prev,
                              [msg.id]: progress,
                            }));
                          }}
                          onEnded={() => {
                            setActiveVoiceMessageId((prev) =>
                              prev === msg.id ? null : prev,
                            );
                            setVoiceProgress((prev) => ({
                              ...prev,
                              [msg.id]: 0,
                            }));
                            const audio = voiceAudioRefs.current[msg.id];
                            if (audio) audio.currentTime = 0;
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            void toggleVoiceMessagePlayback(msg.id)
                          }
                          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            isOwn
                              ? 'bg-white/20 hover:bg-white/30'
                              : 'bg-black/10 hover:bg-black/20'
                          }`}
                        >
                          {activeVoiceMessageId === msg.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={voiceProgress[msg.id] || 0}
                            onChange={(e) =>
                              handleVoiceSeek(msg.id, Number(e.target.value))
                            }
                            className="w-full accent-current"
                          />
                          <span className="text-[11px] tabular-nums opacity-80 min-w-8.5 text-right">
                            {formatDuration(voiceDurations[msg.id] || 0)}
                          </span>
                        </div>
                      </div>
                    ) : msg.message_type === 'image' ||
                      msg.message_type === 'video' ||
                      msg.message_type === 'file' ? (
                      /* ── Media attachment ─────────────────────────────── */
                      <MessageAttachment
                        attachmentId={msg.ciphertext}
                        mediaType={msg.message_type}
                        isOwn={isOwn}
                      />
                    ) : (
                      /* ── Text message ────────────────────────────────── */
                      <p
                        className={`whitespace-pre-wrap ${hasLongToken(msg.ciphertext) ? 'break-all' : 'wrap-break-word'}`}
                      >
                        {msg.is_deleted ? (
                          <span className="italic opacity-60">
                            This message was deleted
                          </span>
                        ) : (
                          msg.ciphertext
                        )}
                      </p>
                    )}

                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}
                    >
                      <span>{format(msg.sent_at, 'h:mm a')}</span>
                      {isOwn && msg.status === 'sent' && (
                        <Check className="w-3 h-3" />
                      )}
                      {isOwn && msg.status === 'delivered' && (
                        <div className="relative">
                          <Check className="w-3 h-3" />
                          <Check className="w-3 h-3 absolute top-0 -right-1" />
                        </div>
                      )}
                      {isOwn && msg.status === 'read' && (
                        <div className="relative">
                          <Check className="w-3 h-3 text-blue-500" />
                          <Check className="w-3 h-3 text-blue-500 absolute top-0 -right-1" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {currentTypingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-message-received rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {currentTypingUsers.map((u) => u.name).join(', ')}
                  {currentTypingUsers.length === 1 ? ' is' : ' are'} typing...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment preview strip — sits between messages and the input bar */}
      <AttachmentPreviewStrip pending={pending} onRemove={removeFile} />

      {/* Input bar */}
      <div className="border-t border-border p-4 bg-card">
        {errorMessage && (
          <p className="text-xs text-destructive mb-2 text-center">
            {errorMessage}
          </p>
        )}
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2"
          onKeyDown={chatButtonEvents}
        >
          {chatMode === 'chat' ? (
            <>
              {/* Paperclip — opens file picker */}
              <button
                type="button"
                onClick={handleFilePickerClick}
                disabled={isSendingMedia}
                className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
                aria-label="Attach file"
              >
                <Paperclip
                  className={`w-5 h-5 ${hasFiles ? 'text-sidebar-primary' : 'text-muted-foreground'}`}
                />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder={
                    hasFiles ? 'Add a caption… (optional)' : 'Type a message...'
                  }
                  className="w-full px-4 py-2 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-lg transition-colors"
                  aria-label="Emoji"
                >
                  <Smile className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Only show mic when there are no pending files */}
              {!hasFiles && (
                <button
                  type="button"
                  onClick={() => void startVoiceRecording()}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  aria-label="Record voice message"
                >
                  <Mic className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </>
          ) : (
            /* Voice recording UI — unchanged */
            <>
              <button
                type="button"
                onClick={discardVoiceRecording}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Discard recording"
              >
                <Trash className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="flex-1 flex items-center gap-3 bg-input-background border border-input rounded-xl px-3 py-2">
                <span className="text-sm text-muted-foreground min-w-12">
                  {formatDuration(recordingTimeSeconds)}
                </span>

                {recordedAudioUrl ? (
                  <>
                    <audio
                      ref={previewAudioRef}
                      src={recordedAudioUrl}
                      onEnded={() => setRecordingPreview('inactive')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setRecordingPreview((prev) =>
                          prev === 'active' ? 'inactive' : 'active',
                        )
                      }
                      className="p-1 hover:bg-accent rounded-lg transition-colors"
                    >
                      {recordingPreview === 'active' ? (
                        <Pause className="w-5 h-5 text-foreground" />
                      ) : (
                        <Play className="w-5 h-5 text-foreground" />
                      )}
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {recordingState === 'recording'
                      ? 'Recording...'
                      : 'Ready to preview'}
                  </span>
                )}

                {recordingState === 'recording' ? (
                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="ml-auto p-1 hover:bg-accent rounded-lg transition-colors"
                  >
                    <Pause className="w-5 h-5 text-foreground" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resumeVoiceRecording}
                    className="ml-auto p-1 hover:bg-accent rounded-lg transition-colors"
                    disabled={!!recordedAudioUrl}
                  >
                    <Mic
                      className={`w-5 h-5 ${recordedAudioUrl ? 'text-muted-foreground' : 'text-foreground'}`}
                    />
                  </button>
                )}
              </div>
            </>
          )}

          {/* Send button */}
          <button
            type={chatMode === 'chat' ? 'submit' : 'button'}
            onClick={chatMode === 'voice' ? handleSendVoice : undefined}
            disabled={!canSend}
            className="p-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 relative"
            aria-label="Send"
          >
            {isSendingMedia || isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
