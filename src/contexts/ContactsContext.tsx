import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
/* eslint-disable react-refresh/only-export-components */
import {
  createContact,
  deleteContact,
  getContacts,
} from '../services/contactsService';
import type { Contact, ContactsContextType } from '../types';

const ContactsContext = createContext<ContactsContextType | undefined>(
  undefined,
);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setContacts(await getContacts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when the user authenticates
  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      queueMicrotask(() => void fetchContacts());
    } else if (isAuthReady && !isAuthenticated) {
      queueMicrotask(() => setContacts([]));
    }
  }, [isAuthReady, isAuthenticated, fetchContacts]);

  const addContact = async (
    user_id: string,
    display_name?: string | null,
  ): Promise<Contact> => {
    const newContact = await createContact(user_id, display_name);
    // Optimistic update — prepend so it appears at the top immediately
    setContacts((prev) => [newContact, ...prev]);
    return newContact;
  };

  const removeContact = async (contactId: string): Promise<void> => {
    await deleteContact(contactId);
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  const isContact = (user_id: string) =>
    contacts.some((c) => c.contact_user_id === user_id);

  const getContact = (user_id: string) =>
    contacts.find((c) => c.contact_user_id === user_id);

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        isLoading,
        error,
        addContact,
        removeContact,
        isContact,
        getContact,
        refresh: fetchContacts,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error('useContacts must be used within ContactsProvider');
  return ctx;
}
