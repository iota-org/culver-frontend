import { apiClient } from '../lib/api';
import type { Contact } from '../types';

export async function getContacts(): Promise<Contact[]> {
  const response = await apiClient.get<{ data: Contact[] }>('/contacts');
  return response.data.data;
}

export async function createContact(
  userId: string,
  displayName?: string | null,
): Promise<Contact> {
  const response = await apiClient.post<{ data: Contact }>('/contacts', {
    user_id: userId,
    display_name: displayName ?? null,
  });
  return response.data.data;
}

export async function deleteContact(contactId: string): Promise<void> {
  await apiClient.delete(`/contacts/${contactId}`);
}
