import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
/* eslint-disable react-refresh/only-export-components */
import {
  createConversation as createConversationRequest,
  getConversation,
  getConversations,
  getMessages,
  type ApiMessage,
  type ApiMessageStatusBroadcast,
  type ApiTypingIndicator,
  mapMessage,
} from '../services/conversationsService';
import type {
  Conversation,
  ConversationsContextType,
  Message,
  CreateConversationParams,
  TypingUser,
} from '../types';

const ConversationsContext = createContext<
  ConversationsContextType | undefined
>(undefined);

const MESSAGE_PAGE_SIZE = 50;

function readMarkersStorageKey(userId?: string) {
  return userId ? `culver-read-markers:${userId}` : null;
}

function getReadMarkers(userId?: string): Record<string, string> {
  const key = readMarkersStorageKey(userId);
  if (!key) return {};

  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

function saveReadMarker(
  userId: string | undefined,
  conversationId: string,
  messageId: string | null,
) {
  if (!messageId) return;

  const key = readMarkersStorageKey(userId);
  if (!key) return;

  const markers = getReadMarkers(userId);
  localStorage.setItem(
    key,
    JSON.stringify({ ...markers, [conversationId]: messageId }),
  );
}

function applyLocalReadMarkers(conversations: Conversation[], userId?: string) {
  const markers = getReadMarkers(userId);

  return conversations.map((conversation) =>
    conversation.last_message_id &&
    markers[conversation.id] === conversation.last_message_id
      ? { ...conversation, unread_count: 0 }
      : conversation,
  );
}

function moveConversationWithLatestMessage(
  conversations: Conversation[],
  conversationId: string,
  message: Message,
  unreadCount: (conversation: Conversation) => number,
) {
  const index = conversations.findIndex((c) => c.id === conversationId);
  if (index === -1) return conversations;

  const conversation = conversations[index];
  const updatedConversation: Conversation = {
    ...conversation,
    last_message_id: message.id,
    last_message_ciphertext: message.ciphertext,
    last_message_type: message.message_type,
    last_message_sender_id: message.sender_id,
    last_message_sent_at: message.sent_at,
    unread_count: unreadCount(conversation),
  };

  return [
    updatedConversation,
    ...conversations.slice(0, index),
    ...conversations.slice(index + 1),
  ];
}

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser[]>>(
    {},
  );

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const messageCursors = useRef<Record<string, string | null>>({});

  const fetchedConversations = useRef<Set<string>>(new Set());
  const joinedConversationRooms = useRef<Set<string>>(new Set());
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!isAuthenticated) {
      queueMicrotask(() => {
        setConversations([]);
        setMessages({});
        fetchedConversations.current.clear();
        messageCursors.current = {};
        joinedConversationRooms.current.clear();
      });
      return;
    }

    const load = async () => {
      setIsLoadingConversations(true);
      try {
        setConversations(
          applyLocalReadMarkers(await getConversations(), userRef.current?.id),
        );
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    void load();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    conversations.forEach((conversation) => {
      if (joinedConversationRooms.current.has(conversation.id)) return;
      socket.emit('conversation:join', conversation.id);
      joinedConversationRooms.current.add(conversation.id);
    });
  }, [conversations, socket]);

  useEffect(() => {
    if (!socket) return;

    const resetJoinedRooms = () => {
      joinedConversationRooms.current.clear();
      conversationsRef.current.forEach((conversation) => {
        socket.emit('conversation:join', conversation.id);
        joinedConversationRooms.current.add(conversation.id);
      });
    };

    socket.on('connect', resetJoinedRooms);
    return () => {
      socket.off('connect', resetJoinedRooms);
    };
  }, [socket]);

  const fetchMessages = useCallback(
    async (conversationId: string, before?: string) => {
      setIsLoadingMessages(true);
      try {
        const { messages: ordered, nextCursor } = await getMessages(
          conversationId,
          before,
          MESSAGE_PAGE_SIZE,
        );

        if (before) {
          setMessages((prev) => ({
            ...prev,
            [conversationId]: [...ordered, ...(prev[conversationId] ?? [])],
          }));
        } else {
          setMessages((prev) => ({ ...prev, [conversationId]: ordered }));
        }

        messageCursors.current[conversationId] = nextCursor;
        return ordered;
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [],
  );

  // Socket event handlers

  const selectedConvRef = useRef(selectedConversation);
  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    if (!socket) return;

    // message:new server broadcasts to all conversation members
    const handleNewMessage = (payload: {
      message: ApiMessage;
      statuses: unknown[];
    }) => {
      const msg = mapMessage(payload.message);
      const convId = msg.conversation_id;

      // Don't add messages sent by the current user - they're already handled by optimistic update
      if (msg.sender_id === userRef.current?.id) {
        return;
      }

      setMessages((prev) => ({
        ...prev,
        [convId]: [...(prev[convId] ?? []), msg],
      }));

      setConversations((prev) =>
        moveConversationWithLatestMessage(prev, convId, msg, (conversation) =>
          selectedConvRef.current?.id === convId
            ? 0
            : conversation.unread_count + 1,
        ),
      );

      if (selectedConvRef.current?.id === convId) {
        saveReadMarker(userRef.current?.id, convId, msg.id);
        socket.emit('message:status', {
          messageId: msg.id,
          conversationId: convId,
          status: 'read',
        });
      }
    };

    // message:status — server broadcasts delivery/read receipts
    const handleStatusBroadcast = (payload: ApiMessageStatusBroadcast) => {
      setMessages((prev) => {
        const updated: Record<string, Message[]> = {};
        for (const [convId, msgs] of Object.entries(prev)) {
          updated[convId] = msgs.map((m) =>
            m.id === payload.messageId
              ? { ...m, status: payload.status as Message['status'] }
              : m,
          );
        }
        return updated;
      });
    };

    // typing:indicator
    const handleTypingIndicator = (payload: ApiTypingIndicator) => {
      setTypingUsers((prev) => {
        const existing = prev[payload.conversationId] ?? [];
        if (payload.isTyping) {
          const alreadyIn = existing.some((u) => u.userId === payload.userId);
          if (alreadyIn) return prev;
          return {
            ...prev,
            [payload.conversationId]: [
              ...existing,
              { userId: payload.userId, name: payload.name },
            ],
          };
        } else {
          return {
            ...prev,
            [payload.conversationId]: existing.filter(
              (u) => u.userId !== payload.userId,
            ),
          };
        }
      });
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:status', handleStatusBroadcast);
    socket.on('typing:indicator', handleTypingIndicator);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:status', handleStatusBroadcast);
      socket.off('typing:indicator', handleTypingIndicator);
    };
  }, [socket]);

  const selectConversation = useCallback(
    (id: string, knownConv?: Conversation) => {
      const conv =
        knownConv ?? conversationsRef.current.find((c) => c.id === id);
      if (!conv) {
        // If conversation not found locally, try to fetch it from the API
        getConversation(id)
          .then((fetchedConv) => {
            // Add to conversations list if not already there
            setConversations((prev) =>
              prev.some((c) => c.id === id)
                ? prev
                : [
                    applyLocalReadMarkers(
                      [fetchedConv],
                      userRef.current?.id,
                    )[0],
                    ...prev,
                  ],
            );
            // Now select it
            setSelectedConversation(fetchedConv);
            socket?.emit('conversation:join', id);
            joinedConversationRooms.current.add(id);
            // Fetch messages
            if (!fetchedConversations.current.has(id)) {
              fetchedConversations.current.add(id);
              void fetchMessages(id);
            }
          })
          .catch((err) => {
            console.error(`Failed to fetch conversation ${id}:`, err);
          });
        return;
      }

      socket?.emit('conversation:join', id);
      joinedConversationRooms.current.add(id);

      setSelectedConversation(conv);
      saveReadMarker(userRef.current?.id, id, conv.last_message_id);

      // Clear unread locally
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
      );

      // Fetch messages once per session
      if (!fetchedConversations.current.has(id)) {
        fetchedConversations.current.add(id);
        void fetchMessages(id).then((fetchedMsgs) => {
          // ✅ Use return value
          fetchedMsgs?.forEach((msg) => {
            if (
              msg.sender_id !== userRef.current?.id &&
              msg.status !== 'read'
            ) {
              socket?.emit('message:status', {
                messageId: msg.id,
                conversationId: id,
                status: 'read',
              });
            }
          });
        });
      }
    },
    [socket, fetchMessages],
  );

  // Pagination
  const hasMoreMessages = useCallback((conversationId: string) => {
    const cursor = messageCursors.current[conversationId];
    // undefined = not yet fetched (might have more); null = exhausted
    return cursor !== null;
  }, []);

  const loadMoreMessages = useCallback(
    async (conversationId: string) => {
      const cursor = messageCursors.current[conversationId];
      if (cursor === null) return;
      await fetchMessages(conversationId, cursor ?? undefined);
    },
    [fetchMessages],
  );
  //
  const sendMessage = useCallback(
    (
      conversationId: string,
      ciphertext: string,
      messageType: Message['message_type'] = 'text',
      replyToId: string | null = null,
    ) => {
      if (!socket) return;

      const sentAt = new Date().toISOString();

      const optimisticId = 'optimistic-' + Date.now();
      const optimistic: Message = {
        id: optimisticId,
        conversation_id: conversationId,
        sender_id: user?.id || 'unknown',
        ciphertext,
        message_type: messageType,
        reply_to_id: replyToId,
        status: 'sent',
        is_deleted: false,
        sent_at: new Date(sentAt),
      };

      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), optimistic],
      }));

      setConversations((prev) =>
        moveConversationWithLatestMessage(
          prev,
          conversationId,
          optimistic,
          (conversation) => conversation.unread_count,
        ),
      );

      socket.emit(
        'message:send',
        {
          conversationId,
          ciphertext,
          messageType,
          replyToId,
          sentAt,
        },
        (response: {
          error?: string;
          data?: { message: ApiMessage; statuses: unknown[] };
        }) => {
          if (response.error || !response.data) {
            // Roll back optimistic message on failure
            setMessages((prev) => ({
              ...prev,
              [conversationId]: (prev[conversationId] ?? []).filter(
                (m) => m.id !== optimisticId,
              ),
            }));
            console.error('Failed to send message:', response.error);
            return;
          }

          const confirmed = mapMessage(response.data.message);

          setMessages((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] ?? []).map((m) =>
              m.id === optimisticId ? confirmed : m,
            ),
          }));

          setConversations((prev) =>
            moveConversationWithLatestMessage(
              prev,
              conversationId,
              confirmed,
              (conversation) => conversation.unread_count,
            ),
          );
        },
      );
    },
    [socket, user?.id],
  );

  const markAsRead = useCallback(
    (conversationId: string, messageId: string) => {
      socket?.emit('message:status', {
        messageId,
        conversationId,
        status: 'read',
      });
      saveReadMarker(userRef.current?.id, conversationId, messageId);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c,
        ),
      );
    },
    [socket],
  );

  const emitTypingStart = useCallback(
    (conversationId: string) => {
      socket?.emit('typing:start', conversationId);
    },
    [socket],
  );

  const emitTypingStop = useCallback(
    (conversationId: string) => {
      socket?.emit('typing:stop', conversationId);
    },
    [socket],
  );

  const archiveConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, isArchived: true } : c,
      ),
    );
  }, []);

  const unarchiveConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, isArchived: false } : c,
      ),
    );
  }, []);

  const createConversation = useCallback(
    async (params: CreateConversationParams): Promise<string> => {
      const created = await createConversationRequest(params);
      setConversations((prev) => {
        // Avoid duplicates if socket already delivered it
        if (prev.some((c) => c.id === created.id)) return prev;
        return [created, ...prev];
      });
      selectConversation(created.id, created);
      return created.id;
    },
    [selectConversation],
  );

  // this is Background refresh useeffect, every 60secs

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      try {
        const refreshed = await getConversations();
        setConversations((prev) => {
          // Preserve local-only isArchived state
          return applyLocalReadMarkers(refreshed, userRef.current?.id).map(
            (fresh) => {
              const existing = prev.find((p) => p.id === fresh.id);
              return existing?.isArchived
                ? { ...fresh, isArchived: true }
                : fresh;
            },
          );
        });
      } catch (err) {
        console.error('Failed to refresh conversations:', err);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        selectedConversation,
        setSelectedConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        selectConversation,
        sendMessage,
        markAsRead,
        archiveConversation,
        unarchiveConversation,
        createConversation,
        hasMoreMessages,
        loadMoreMessages,
        typingUsers,
        emitTypingStart,
        emitTypingStop,
      }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationsContext);
  if (!context)
    throw new Error(
      'useConversations must be used within ConversationsProvider',
    );
  return context;
}
