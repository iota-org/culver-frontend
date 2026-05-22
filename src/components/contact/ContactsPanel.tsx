import { useState } from 'react';
import {
  Search,
  UserPlus,
  MessageCircle,
  Trash2,
  Loader2,
  Users,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { useContacts } from '../../contexts/ContactsContext';
import { useConversations } from '../../contexts/ConversationsContext';
import NewChatModal from '../chat/NewChatModal';

interface ContactsPanelProps {
  resetContactView: () => void;
  onOpenConversation: (conversationId: string) => void;
}

export default function ContactsPanel({
  resetContactView,
  onOpenConversation,
}: ContactsPanelProps) {
  const { contacts, isLoading, error, removeContact } = useContacts();
  const { createConversation } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const filtered = contacts.filter((c) => {
    const name = (c.display_name ?? c.name ?? '').toLowerCase();
    const phone = (c.phone_number ?? '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  const handleMessage = async (contactUserId: string, contactRowId: string) => {
    setMessagingId(contactRowId);
    try {
      const convId = await createConversation({
        type: 'direct',
        member_ids: [contactUserId],
      });
      resetContactView();
      onOpenConversation(convId);
    } finally {
      setMessagingId(null);
    }
  };

  const handleRemove = async (contactId: string) => {
    setRemovingId(contactId);
    try {
      await removeContact(contactId);
    } finally {
      setRemovingId(null);
      setConfirmRemoveId(null);
    }
  };

  const displayName = (c: (typeof contacts)[number]) =>
    c.display_name ?? c.name ?? 'Unknown';

  const initial = (c: (typeof contacts)[number]) =>
    displayName(c).charAt(0).toUpperCase();

  return (
    <div className="bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="py-2 px-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="font-semibold text-sidebar-foreground">
            Contacts
          </span>
          <NewChatModal onOpenConversation={onOpenConversation}>
            <button
              title="Add contact"
              className="p-2 text-muted-foreground rounded-full hover:text-sidebar-foreground transition-colors"
            >
              <UserPlus className="w-5 h-5 text-sidebar-foreground" />
            </button>
          </NewChatModal>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-sidebar-accent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-[3px]">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin opacity-50" />
            <p className="text-sm">Loading contacts…</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-4">
            <AlertCircle className="w-8 h-8 opacity-50" />
            <p className="text-sm text-center">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 gap-3">
            <Users className="w-12 h-12 opacity-30" />
            <p className="text-sm font-medium">No contacts yet</p>
            <p className="text-xs text-center opacity-70">
              Search by phone number to find and save people
            </p>
            <NewChatModal onOpenConversation={onOpenConversation}>
              <button className="mt-2 flex items-center gap-2 px-4 py-2 bg-sidebar-accent text-sidebar-foreground rounded-lg text-sm hover:opacity-80 transition-opacity">
                <UserPlus className="w-4 h-4" />
                Add your first contact
              </button>
            </NewChatModal>
          </div>
        )}

        {/* No search results */}
        {!isLoading &&
          !error &&
          contacts.length > 0 &&
          filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
              <Search className="w-8 h-8 opacity-30 mb-2" />
              <p className="text-sm">No contacts match "{searchQuery}"</p>
            </div>
          )}

        {/* Contact list */}
        {!isLoading && !error && filtered.length > 0 && (
          <div>
            {/* Alphabetical section count */}
            <p className="px-4 pt-3 pb-1 text-xs text-muted-foreground uppercase tracking-wider">
              {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
            </p>

            {filtered.map((contact) => {
              const isConfirmingRemove = confirmRemoveId === contact.id;

              return (
                <div
                  key={contact.id}
                  className="w-full px-3 py-2.5 flex items-center gap-3 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center text-muted-foreground font-medium">
                    {contact.avatar_url ? (
                      <img
                        src={contact.avatar_url}
                        alt={displayName(contact)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{initial(contact)}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sidebar-foreground truncate text-sm">
                      {displayName(contact)}
                    </p>
                    {contact.phone_number && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {contact.phone_number}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {isConfirmingRemove ? (
                    /* Confirm remove inline */
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground mr-1">
                        Remove?
                      </span>
                      <button
                        onClick={() => handleRemove(contact.id)}
                        disabled={removingId === contact.id}
                        className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {removingId === contact.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Yes'
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmRemoveId(null)}
                        className="px-2 py-1 text-xs bg-muted rounded-md hover:bg-accent transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Message */}
                      <button
                        onClick={() =>
                          handleMessage(contact.contact_user_id, contact.id)
                        }
                        disabled={messagingId === contact.id}
                        title="Send message"
                        className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-sidebar-foreground"
                      >
                        {messagingId === contact.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MessageCircle className="w-4 h-4" />
                        )}
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => setConfirmRemoveId(contact.id)}
                        title="Remove contact"
                        className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
