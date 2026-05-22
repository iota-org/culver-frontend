import { apiClient, publicApiClient } from '../lib/api';
import type {
  MeResponse,
  PatchMeResponse,
  UpdateProfilePayload,
  User,
  UserPayload,
} from '../types';

export function mapBackendUser(payload: UserPayload): User {
  return {
    id: payload.id,
    phone_number: payload.phone_number,
    name: payload.name || '',
    avatar_url: payload.avatar_url,
    is_verified: payload.is_verified,
    avatar: payload.avatar_url || undefined,
    bio: payload.bio || undefined,
  };
}

export async function fetchCurrentUserProfile(): Promise<User> {
  const response = await apiClient.get<MeResponse>('/auth/me');
  return mapBackendUser(response.data.data.user);
}

type PhoneCheckResponse =
  | { exists: boolean }
  | { data: { exists: boolean } }
  | { data: { user_exists: boolean } };

export async function checkUserExistsByPhone(phone: string): Promise<boolean> {
  const response = await publicApiClient.get<PhoneCheckResponse>(
    '/auth/check-phone',
    {
      params: { phone },
    },
  );

  const payload = response.data;

  if ('exists' in payload) return payload.exists;
  if ('exists' in payload.data) return payload.data.exists;
  return payload.data.user_exists;
}

export async function updateCurrentUser(
  payload: UpdateProfilePayload,
): Promise<User> {
  const response = await apiClient.patch<PatchMeResponse>('/users/me', payload);
  return mapBackendUser(response.data.data);
}

export async function uploadCurrentUserAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await apiClient.post<{ data: { avatar_url: string } }>(
    '/users/me/avatar',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data.data.avatar_url;
}
