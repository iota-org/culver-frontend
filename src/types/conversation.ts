//    Message ───────────────────────────────────────────────────────────────────

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'system';
export type MessageStatus = 'sent' | 'deleted' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  ciphertext: string;
  message_type: MessageType;
  reply_to_id: string | null;
  status: MessageStatus;
  is_deleted: boolean;
  sent_at: Date;
}

//    Conversation ──────────────────────────────────────────────────────────────

export type ConversationType = 'direct' | 'group';

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  // Flattened last-message fields from the API
  last_message_id: string | null;
  last_message_ciphertext: string | null;
  last_message_type: MessageType | null;
  last_message_sender_id: string | null;
  last_message_sent_at: Date | null;
  unread_count: number;
  // Local-only state (not persisted to backend)
  isArchived?: boolean;
}

export interface CreateConversationParams {
  type: ConversationType;
  member_ids: string[];
  name?: string;
  avatar_url?: string | null;
}

//    Members ───────────────────────────────────────────────────────────────────

export type MemberRole = 'admin' | 'member';

export interface MemberRow {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
}

export interface MemberWithProfile extends MemberRow {
  name: string;
  phone_number: string;
  avatar_url: string | null;
  bio: string | null;
}

//    Typing ────────────────────────────────────────────────────────────────────

export interface TypingUser {
  userId: string;
  name: string;
}

//    Conversations context ─────────────────────────────────────────────────────

export interface ConversationsContextType {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  setSelectedConversation: (conv: Conversation | null) => void;
  messages: Record<string, Message[]>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  selectConversation: (id: string, knownConv?: Conversation) => void;
  sendMessage: (
    conversationId: string,
    ciphertext: string,
    messageType?: MessageType,
    replyToId?: string | null,
  ) => void;
  markAsRead: (conversationId: string, messageId: string) => void;
  archiveConversation: (conversationId: string) => void;
  unarchiveConversation: (conversationId: string) => void;
  createConversation: (params: CreateConversationParams) => Promise<string>;
  hasMoreMessages: (conversationId: string) => boolean;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  typingUsers: Record<string, TypingUser[]>;
  emitTypingStart: (conversationId: string) => void;
  emitTypingStop: (conversationId: string) => void;
}
