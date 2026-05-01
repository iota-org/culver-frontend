import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Search, User, Users } from 'lucide-react';
import { useConversations } from '../contexts/ConversationsContext';

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnline?: boolean;
}

const mockContacts: Contact[] = [
  {
    id: '2',
    name: 'Aris Christoff',
    phone: '+1 (555) 123-4567',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Eddie Bennett',
    phone: '+1 (555) 234-5678',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Beth Mendez',
    phone: '+1 (555) 345-6789',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    isOnline: true,
  },
  {
    id: '5',
    name: 'Cameron Rivera',
    phone: '+1 (555) 456-7890',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    isOnline: false,
  },
  {
    id: '6',
    name: 'Dana Kim',
    phone: '+1 (555) 567-8901',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    isOnline: true,
  },
];

interface NewChatModalProps {
  children: React.ReactNode;
}

export default function NewChatModal({ children }: NewChatModalProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const { createConversation, selectConversation, conversations } =
    useConversations();
  const navigate = useNavigate();

  const filteredContacts = mockContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery),
  );

  const toggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId],
    );
  };

  const handleCreateChat = () => {
    if (selectedContacts.length === 0) return;

    const isGroup = selectedContacts.length > 1;
    const selectedContactsData = mockContacts.filter((c) =>
      selectedContacts.includes(c.id),
    );
    const contactNames = selectedContactsData.map((c) => c.name);

    const name = isGroup ? contactNames.join(', ') : contactNames[0];

    // Check if conversation already exists with these participants
    const existingConv = conversations.find((conv) => {
      if (conv.isGroup !== isGroup) return false;
      if (isGroup) return false; // For simplicity, always create new group
      // For 1-on-1, check if same participants
      return conv.participants.some((p) => selectedContacts.includes(p));
    });

    if (existingConv) {
      selectConversation(existingConv.id);
      navigate(`/chat/${existingConv.id}`);
    } else {
      // Create conversation and get the new ID
      const avatar = !isGroup ? selectedContactsData[0]?.avatar : undefined;
      const newId = createConversation(name, selectedContacts, isGroup, avatar);

      // Navigate after state update
      setTimeout(() => {
        selectConversation(newId);
        navigate(`/chat/${newId}`);
      }, 50);
    }

    setOpen(false);
    setSelectedContacts([]);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
          <DialogDescription>
            Search and select contacts to start a conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts or enter phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="max-h-75 overflow-y-auto space-y-1">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">No contacts found</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => toggleContact(contact.id)}
                  className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors ${
                    selectedContacts.includes(contact.id)
                      ? 'bg-accent'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                      {contact.avatar ? (
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {contact.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.phone}
                    </p>
                  </div>

                  {selectedContacts.includes(contact.id) && (
                    <div className="w-5 h-5 rounded-full bg-accent-foreground flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {selectedContacts.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <div className="flex-1 text-sm text-muted-foreground">
                {selectedContacts.length === 1 ? (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />1 contact selected
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedContacts.length} contacts selected (Group)
                  </span>
                )}
              </div>
              <button
                onClick={handleCreateChat}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Create Chat
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
