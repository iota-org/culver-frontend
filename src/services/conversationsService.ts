import { apiClient } from '../lib/api';
import type {
  Conversation,
  CreateConversationParams,
  MemberRole,
  MemberRow,
  MemberWithProfile,
  Message,
} from '../types';
import { getUserProfile } from './usersService';

export interface ApiConversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_message_id: string | null;
  last_message_ciphertext: string | null;
  last_message_type: Message['message_type'] | null;
  last_message_sender_id: string | null;
  last_message_sent_at: string | null;
  unread_count: number;
}

export interface ApiMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  ciphertext: string;
  message_type: Message['message_type'];
  reply_to_id: string | null;
  status: 'sent' | 'deleted';
  is_deleted: boolean;
  sent_at: string;
  created_at: string;
  updated_at: string;
}

export interface ApiMessageStatusBroadcast {
  messageId: string;
  userId: string;
  status: 'delivered' | 'read';
}

export interface ApiTypingIndicator {
  conversationId: string;
  userId: string;
  name: string;
  isTyping: boolean;
}

export function mapConversation(conversation: ApiConversation): Conversation {
  return {
    id: conversation.id,
    type: conversation.type,
    name: conversation.name,
    avatar_url: conversation.avatar_url,
    created_by: conversation.created_by,
    created_at: new Date(conversation.created_at),
    updated_at: new Date(conversation.updated_at),
    last_message_id: conversation.last_message_id,
    last_message_ciphertext: conversation.last_message_ciphertext,
    last_message_type: conversation.last_message_type,
    last_message_sender_id: conversation.last_message_sender_id,
    last_message_sent_at: conversation.last_message_sent_at
      ? new Date(conversation.last_message_sent_at)
      : null,
    unread_count: conversation.unread_count,
  };
}

export function mapMessage(message: ApiMessage): Message {
  return {
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    ciphertext: message.ciphertext,
    message_type: message.message_type,
    reply_to_id: message.reply_to_id,
    status: message.status,
    is_deleted: message.is_deleted,
    sent_at: new Date(message.sent_at),
  };
}

export async function getConversations(): Promise<Conversation[]> {
  const response = await apiClient.get<{ data: ApiConversation[] }>(
    '/conversations',
  );
  return response.data.data.map(mapConversation);
}

export async function getConversation(id: string): Promise<Conversation> {
  const response = await apiClient.get<{ data: ApiConversation }>(
    `/conversations/${id}`,
  );
  return mapConversation(response.data.data);
}

export async function getMessages(
  conversationId: string,
  before?: string,
  limit = 50,
): Promise<{ messages: Message[]; nextCursor: string | null }> {
  const params: Record<string, string | number> = { limit };
  if (before) params.before = before;

  const response = await apiClient.get<{
    data: ApiMessage[];
    pagination: { limit: number; next_cursor: string | null };
  }>(`/conversations/${conversationId}/messages`, { params });

  return {
    messages: response.data.data.map(mapMessage).reverse(),
    nextCursor: response.data.pagination.next_cursor,
  };
}

export async function createConversation(
  params: CreateConversationParams,
): Promise<Conversation> {
  const response = await apiClient.post<{ data: ApiConversation }>(
    '/conversations',
    {
      type: params.type,
      member_ids: params.member_ids,
      ...(params.name ? { name: params.name } : {}),
      ...(params.avatar_url !== undefined
        ? { avatar_url: params.avatar_url }
        : {}),
    },
  );
  return mapConversation(response.data.data);
}

export async function createMessage(
  conversationId: string,
  ciphertext: string,
  messageType: Message['message_type'],
): Promise<Message> {
  const response = await apiClient.post<{ data: ApiMessage }>(
    `/conversations/${conversationId}/messages`,
    {
      ciphertext,
      message_type: messageType,
    },
  );
  return mapMessage(response.data.data);
}

export async function getConversationMembers(
  conversationId: string,
): Promise<MemberRow[]> {
  const response = await apiClient.get<{ data: MemberRow[] }>(
    `/conversations/${conversationId}/members`,
  );
  return response.data.data;
}

export async function getConversationMembersWithProfiles(
  conversationId: string,
): Promise<MemberWithProfile[]> {
  const members = await getConversationMembers(conversationId);
  const withProfiles = await Promise.all(
    members.map(async (member) => {
      const user = await getUserProfile(member.user_id);
      return {
        ...member,
        name: user.name ?? 'Unknown',
        phone_number: user.phone_number,
        avatar_url: user.avatar_url,
        bio: user.bio,
      } satisfies MemberWithProfile;
    }),
  );

  return withProfiles.sort((a, b) => {
    if (a.role === b.role) return a.name.localeCompare(b.name);
    return a.role === 'admin' ? -1 : 1;
  });
}

export async function getOtherConversationMemberProfile(
  conversationId: string,
  currentUserId?: string,
) {
  const members = await getConversationMembers(conversationId);
  const other = members.find((member) => member.user_id !== currentUserId);
  if (!other) throw new Error('Could not find the other participant');
  return getUserProfile(other.user_id);
}

export async function updateConversationName(
  conversationId: string,
  name: string,
): Promise<void> {
  await apiClient.patch(`/conversations/${conversationId}`, { name });
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await apiClient.delete(`/conversations/${conversationId}`);
}

export async function removeConversationMember(
  conversationId: string,
  userId: string,
): Promise<void> {
  await apiClient.delete(`/conversations/${conversationId}/members/${userId}`);
}

export async function updateConversationMemberRole(
  conversationId: string,
  userId: string,
  role: MemberRole,
): Promise<void> {
  await apiClient.patch(`/conversations/${conversationId}/members/${userId}`, {
    role,
  });
}
