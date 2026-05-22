import { apiClient } from '../lib/api';

export interface UserProfile {
  id: string;
  name: string | null;
  phone_number: string;
  avatar_url: string | null;
  bio: string | null;
}

export interface FoundUser {
  id: string;
  name: string;
  bio: string | null;
  phone_number: string;
  avatar_url: string | null;
}

interface ApiUserResponse {
  data: {
    id: string;
    firebase_uid: string;
    name: string;
    phone_number: string;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const response = await apiClient.get<{ data: UserProfile }>(
    `/users/${userId}`,
  );
  return response.data.data;
}

export async function searchUserByPhone(phone: string): Promise<FoundUser> {
  const response = await apiClient.get<ApiUserResponse>('/users/search', {
    params: { phone },
  });
  const user = response.data.data;

  return {
    id: user.id,
    name: user.name,
    bio: user.bio,
    phone_number: user.phone_number,
    avatar_url: user.avatar_url,
  };
}
