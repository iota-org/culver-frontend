export interface Contact {
  id: string;
  owner_id: string;
  contact_user_id: string;
  display_name: string | null;
  name: string;
  phone_number: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface ContactsContextType {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  addContact: (
    user_id: string,
    display_name?: string | null,
  ) => Promise<Contact>;
  removeContact: (contactId: string) => Promise<void>;
  isContact: (user_id: string) => boolean;
  getContact: (user_id: string) => Contact | undefined;
  refresh: () => Promise<void>;
}
