import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  Check,
  CheckCheck,
  Pause,
  Trash,
  Play,
} from 'lucide-react';
import { useConversations } from '../contexts/ConversationsContext';
import { format } from 'date-fns';
import { useSocket } from '../contexts/SocketContext';

type ChatPanelProps = {
  toggleContactInfo: () => void;
};

export default function ChatPanel({ toggleContactInfo }: ChatPanelProps) {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const {
    selectedConversation,
    messages,
    sendMessage,
    sendVoiceMessage,
    setSelectedConversation,
  } = useConversations();
  const [inputValue, setInputValue] = useState('');
  const typingTimeoutRef = useRef<number | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const recordingTickRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
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
    () => (selectedConversation ? messages[selectedConversation.id] || [] : []),
    [selectedConversation, messages],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  useEffect(() => {
    if (!socket || !selectedConversation) return;

    socket.emit(
      'conversation:join',
      selectedConversation.id,
      (err?: string) => {
        if (err) {
          console.error('Failed to join conversation:', err);
          return;
        }
        console.log('Joined conversation room:', selectedConversation.id);
      },
    );

    return () => {
      socket.emit(
        'conversation:leave',
        selectedConversation.id,
        (err?: string) => {
          if (err) {
            console.error('Failed to leave conversation:', err);
          }
        },
      );
    };
  }, [socket, selectedConversation]);

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
      if (!audio) return;
      if (exceptMessageId && messageId === exceptMessageId) return;
      if (!audio.paused) {
        audio.pause();
      }
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
      setVoiceProgress((prev) => ({
        ...prev,
        [messageId]: 0,
      }));
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

    setVoiceProgress((prev) => ({
      ...prev,
      [messageId]: clamped,
    }));
  };

  const handleSendText = () => {
    if (!inputValue.trim() || !selectedConversation) return;

    sendMessage(selectedConversation.id, inputValue);
    setInputValue('');
  };

  const startVoiceRecording = async () => {
    if (!selectedConversation) return;

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setErrorMessage('Voice recording is not supported in this browser.');
      return;
    }

    try {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      setRecordedAudioUrl(null);
      setErrorMessage(null);
      setRecordingTimeSeconds(0);
      setRecordingPreview('inactive');
      recordedChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: 'audio/webm',
        });

        if (audioBlob.size === 0) {
          setErrorMessage('No audio was captured. Please try again.');
          return;
        }

        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
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
    if (!recorder) return;

    if (recorder.state === 'paused') {
      recorder.resume();
      setRecordingState('recording');
      stopRecordingTimer();
      recordingTickRef.current = window.setInterval(() => {
        setRecordingTimeSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    setRecordingState('paused');
    stopRecordingTimer();
    releaseMicrophone();
  };

  const discardVoiceRecording = () => {
    stopRecordingTimer();

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }

    releaseMicrophone();

    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }

    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    setRecordedAudioUrl(null);
    setRecordingTimeSeconds(0);
    setRecordingState(null);
    setRecordingPreview('inactive');
    setChatMode('chat');
    setErrorMessage(null);
  };

  const handleSendVoice = () => {
    if (!selectedConversation || !recordedAudioUrl) return;

    sendVoiceMessage(
      selectedConversation.id,
      recordedAudioUrl,
      recordingTimeSeconds,
    );

    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    setRecordedAudioUrl(null);
    setRecordingTimeSeconds(0);
    setRecordingState(null);
    setRecordingPreview('inactive');
    setChatMode('chat');
    setErrorMessage(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (!socket || !selectedConversation) return;

    // Emit typing:start
    socket.emit('typing:start', selectedConversation.id);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing:stop if no input
    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit('typing:stop', selectedConversation.id);
    }, 3000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMode === 'chat') {
      handleSendText();
      return;
    }

    handleSendVoice();
  };

  const chatButtonEvents = (e: React.KeyboardEvent) => {
    console.log(
      'Key pressed:',
      e.key,
      'Shift:',
      e.shiftKey,
      'Chat mode:',
      chatMode,
    );
    if (e.key === 'Escape' && chatMode === 'voice') {
      discardVoiceRecording();
    }
    if (e.key === 'Enter' && chatMode === 'voice') {
      handleSendVoice();
    }
    if (e.key === 'Enter' && chatMode === 'chat' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
    if (e.key === 'Enter' && chatMode === 'chat' && e.shiftKey) {
      e.preventDefault();
      setInputValue((prev) => prev + '\n');
    }
    if (e.key === 'Escape' && chatMode === 'chat') {
      setInputValue('');
      setSelectedConversation(null);
      navigate(`/`);
    }
  };

  useEffect(() => {
    return () => {
      stopRecordingTimer();
      releaseMicrophone();
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (recordingPreview === 'active') {
      previewAudioRef.current?.play().catch(() => {
        setRecordingPreview('inactive');
      });
    } else {
      previewAudioRef.current?.pause();
    }
  }, [recordingPreview]);

  useEffect(() => {
    return () => {
      pauseAllVoiceMessages();
    };
  }, []);

  useEffect(() => {
    pauseAllVoiceMessages();
    const resetActiveVoiceMessageId = window.setTimeout(() => {
      setActiveVoiceMessageId(null);
    }, 0);

    return () => window.clearTimeout(resetActiveVoiceMessageId);
  }, [selectedConversation?.id]);
  useEffect(() => {
    if (!socket) return;

    socket.on(
      'typing:indicator',
      ({ userId, name, isTyping, conversationId }) => {
        // Only show indicator for the currently open conversation
        if (conversationId !== selectedConversation?.id) return;

        setTypingUsers((prev) => {
          if (isTyping) {
            return { ...prev, [userId]: name };
          } else {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
          }
        });
      },
    );

    return () => {
      socket.off('typing:indicator');
    };
  }, [socket, selectedConversation?.id]);

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

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="h-16 border-b border-border px-6 flex items-center justify-between bg-card">
        <div
          className="flex items-center gap-3 p-2 pr-24 hover:bg-sidebar-accent rounded-lg cursor-pointer transition-colors"
          onClick={toggleContactInfo}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
              {selectedConversation.avatar ? (
                <img
                  src={selectedConversation.avatar}
                  alt={selectedConversation.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground">
                  {selectedConversation.name.charAt(0)}
                </div>
              )}
            </div>
            {selectedConversation.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
            )}
          </div>
          <div>
            <h3 className="font-medium">{selectedConversation.name}</h3>
            <p className="text-xs text-muted-foreground">
              {selectedConversation.isOnline ? 'Online' : 'Offline'}
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

      <div className="max-w-full flex-1 overflow-y-auto p-6 space-y-4">
        {conversationMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          conversationMessages.map((msg, idx) => {
            const isOwn = msg.sender_id === '1';
            const showTimestamp =
              idx === 0 ||
              (conversationMessages[idx - 1] &&
                new Date(msg.timestamp).getTime() -
                  new Date(conversationMessages[idx - 1].timestamp).getTime() >
                  300000);

            return (
              <div key={msg.id}>
                {showTimestamp && (
                  <div className="text-center text-xs text-muted-foreground my-4">
                    {format(msg.timestamp, 'EEEE, MMM d, h:mm a')}
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
                    {msg.type === 'voice' ? (
                      <div className="min-w-55 flex items-center gap-3">
                        <audio
                          ref={(el) => {
                            voiceAudioRefs.current[msg.id] = el;
                          }}
                          src={msg.content}
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
                            if (audio) {
                              audio.currentTime = 0;
                            }
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => toggleVoiceMessagePlayback(msg.id)}
                          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            isOwn
                              ? 'bg-white/20 hover:bg-white/30'
                              : 'bg-black/10 hover:bg-black/20'
                          }`}
                          aria-label={
                            activeVoiceMessageId === msg.id
                              ? 'Pause voice message'
                              : 'Play voice message'
                          }
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
                            aria-label="Seek voice message"
                          />
                          <span className="text-[11px] tabular-nums opacity-80 min-w-8.5 text-right">
                            {formatDuration(voiceDurations[msg.id] || 0)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p
                        className={`whitespace-pre-wrap ${
                          hasLongToken(msg.content)
                            ? 'break-all'
                            : 'wrap-break-word'
                        }`}
                      >
                        {msg.content}
                      </p>
                    )}
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}
                    >
                      <span>{format(msg.timestamp, 'h:mm a')}</span>
                      {isOwn && (
                        <span>
                          {msg.status === 'sent' && (
                            <Check className="w-3 h-3" />
                          )}
                          {msg.status === 'delivered' && (
                            <CheckCheck className="w-3 h-3" />
                          )}
                          {msg.status === 'read' && (
                            <CheckCheck className="w-3 h-3 text-blue-800" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {Object.keys(typingUsers).length > 0 && (
          <div className="flex justify-start">
            <div className="bg-message-received rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Object.values(typingUsers).join(', ')}
                  {Object.keys(typingUsers).length === 1 ? ' is' : ' are'}{' '}
                  typing...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4 bg-card">
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2"
          onKeyDown={(e) => chatButtonEvents(e)}
        >
          {chatMode === 'chat' ? (
            <>
              <button
                type="button"
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <Paperclip className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e)}
                  // onKeyDown={(e) => chatButtonEvents(e)}
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-lg transition-colors"
                >
                  <Smile className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <button
                type="button"
                onClick={startVoiceRecording}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <Mic className="w-5 h-5 text-muted-foreground" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={discardVoiceRecording}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Discard voice recording"
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
                      aria-label={
                        recordingPreview === 'active'
                          ? 'Pause preview'
                          : 'Play preview'
                      }
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
                    aria-label="Stop recording"
                  >
                    <Pause className="w-5 h-5 text-foreground" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resumeVoiceRecording}
                    className="ml-auto p-1 hover:bg-accent rounded-lg transition-colors"
                    aria-label="Resume recording"
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
          {errorMessage && (
            <span className="text-xs text-red-500">{errorMessage}</span>
          )}
          <button
            type={chatMode === 'chat' ? 'submit' : 'button'}
            onClick={chatMode === 'voice' ? handleSendVoice : undefined}
            disabled={
              chatMode === 'chat' ? !inputValue.trim() : !recordedAudioUrl
            }
            className="p-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
