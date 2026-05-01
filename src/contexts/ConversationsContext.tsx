import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file' | 'voice';
}

export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  isGroup: boolean;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isOnline?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
}

interface ConversationsContextType {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Record<string, Message[]>;
  selectConversation: (id: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  sendVoiceMessage: (
    conversationId: string,
    audioUrl: string,
    durationInSeconds: number,
  ) => void;
  markAsRead: (conversationId: string) => void;
  archiveConversation: (conversationId: string) => void;
  unarchiveConversation: (conversationId: string) => void;
  createConversation: (
    name: string,
    participants: string[],
    isGroup: boolean,
  ) => void;
}

const ConversationsContext = createContext<
  ConversationsContextType | undefined
>(undefined);

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Omolola',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    isGroup: false,
    participants: ['1', '2'],
    unreadCount: 2,
    isOnline: true,
    isPinned: true,
  },
  {
    id: '2',
    name: 'Chuka',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    isGroup: false,
    participants: ['1', '3'],
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: '3',
    name: 'Bolu',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    isGroup: false,
    participants: ['1', '4'],
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: '4',
    name: 'Purpose',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    isGroup: false,
    participants: ['1', '5'],
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: '5',
    name: 'Group chat',
    avatar:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop',
    isGroup: true,
    participants: ['1', '2', '3', '4', '5'],
    unreadCount: 5,
  },
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: 'm1',
      conversation_id: '1',
      sender_id: '2',
      content: 'Hey! How are you doing today?',
      timestamp: new Date(Date.now() - 3600000),
      status: 'read',
      type: 'text',
    },
    {
      id: 'm2',
      conversation_id: '1',
      sender_id: '1',
      content: "I'm doing great! Just finished the new design mockups.",
      timestamp: new Date(Date.now() - 3000000),
      status: 'read',
      type: 'text',
    },
    {
      id: 'm3',
      conversation_id: '1',
      sender_id: '2',
      content: "That's awesome! Can you share them with me?",
      timestamp: new Date(Date.now() - 1800000),
      status: 'read',
      type: 'text',
    },
    {
      id: 'm4',
      conversation_id: '1',
      sender_id: '1',
      content: 'Sure thing! Sending them over now.',
      timestamp: new Date(Date.now() - 900000),
      status: 'sent',
      type: 'text',
    },
  ],
};

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] =
    useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] =
    useState<Record<string, Message[]>>(mockMessages);

  const markAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
    );

    setMessages((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((m) => ({
        ...m,
        status: m.sender_id !== '1' ? 'read' : m.status,
      })),
    }));
  }, []);

  const selectConversation = useCallback(
    (id: string) => {
      const conv = conversations.find((c) => c.id === id);
      if (conv) {
        setSelectedConversation(conv);
        markAsRead(id);
      }
    },
    [conversations, markAsRead],
  );

  const sendMessage = useCallback((conversationId: string, content: string) => {
    const newMessage: Message = {
      id: 'm' + Date.now(),
      conversation_id: conversationId,
      sender_id: '1',
      content,
      timestamp: new Date(),
      status: 'sent',
      type: 'text',
    };

    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, lastMessage: newMessage } : c,
      ),
    );

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: prev[conversationId].map((m) =>
          m.id === newMessage.id ? { ...m, status: 'delivered' } : m,
        ),
      }));
    }, 1000);
  }, []);

  const sendVoiceMessage = useCallback(
    (conversationId: string, audioUrl: string, durationInSeconds: number) => {
      const formattedDuration = `${Math.floor(durationInSeconds / 60)}:${String(
        durationInSeconds % 60,
      ).padStart(2, '0')}`;

      const newMessage: Message = {
        id: 'm' + Date.now(),
        conversation_id: conversationId,
        sender_id: '1',
        content: audioUrl,
        timestamp: new Date(),
        status: 'sent',
        type: 'voice',
      };

      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage],
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: {
                  ...newMessage,
                  content: `Voice message (${formattedDuration})`,
                },
              }
            : c,
        ),
      );

      setTimeout(() => {
        setMessages((prev) => ({
          ...prev,
          [conversationId]: prev[conversationId].map((m) =>
            m.id === newMessage.id ? { ...m, status: 'delivered' } : m,
          ),
        }));
      }, 1000);
    },
    [],
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
    (name: string, participants: string[], isGroup: boolean) => {
      const newConv: Conversation = {
        id: 'c' + Date.now(),
        name,
        isGroup,
        participants: ['1', ...participants],
        unreadCount: 0,
      };
      setConversations((prev) => [newConv, ...prev]);
    },
    [],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          lastMessage: c.lastMessage
            ? {
                ...c.lastMessage,
                timestamp: c.lastMessage.timestamp,
              }
            : undefined,
        })),
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        selectedConversation,
        messages,
        selectConversation,
        sendMessage,
        sendVoiceMessage,
        markAsRead,
        archiveConversation,
        unarchiveConversation,
        createConversation,
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
