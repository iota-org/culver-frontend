import {
  ArrowLeft,
  Phone,
  Mail,
  AtSign,
  Bell,
  Archive,
  Trash2,
  Ban,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useConversations } from '../contexts/ConversationsContext';

type ContactDetailsProps = {
  onClose: () => void;
};

export default function ContactDetails({ onClose }: ContactDetailsProps) {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { conversations, archiveConversation } = useConversations();

  // Find the conversation for this contact
  const conversation = conversations.find((c) => c.id === conversationId);

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2">Contact Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This contact doesn't exist.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleArchive = () => {
    archiveConversation(conversation.id);
    navigate('/');
  };

  const isGroup = conversation.type === 'group';
  const displayName = conversation.name ?? (isGroup ? 'Group' : 'Unknown');

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center gap-4 z-10">
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1>{isGroup ? 'Group Info' : 'Contact Info'}</h1>
        </div>

        <div className="max-w-3xl p-6 space-y-6 mx-auto">
          {/* Profile Section */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex flex-col items-center p-8">
              <div className="w-32 h-32 rounded-full bg-muted overflow-hidden mb-4">
                {conversation.avatar_url ? (
                  <img
                    src={conversation.avatar_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {displayName.charAt(0)}
                  </div>
                )}
              </div>
              <h2 className="mb-2">{displayName}</h2>
              {isGroup && (
                <p className="text-sm text-muted-foreground mt-1">
                  Group conversation
                </p>
              )}
            </div>

            {!isGroup && (
              <div className="border-t border-border divide-y divide-border">
                <div className="px-6 py-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="w-5 h-5" />
                    <div>
                      <p className="text-sm">Phone</p>
                      <p className="text-foreground">+1 (555) 123-4567</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="w-5 h-5" />
                    <div>
                      <p className="text-sm">Email</p>
                      <p className="text-foreground">contact@example.com</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <AtSign className="w-5 h-5" />
                    <div>
                      <p className="text-sm">Username</p>
                      <p className="text-foreground">
                        @{displayName.toLowerCase().replace(' ', '')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings Section */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <h3 className="px-6 py-4 border-b border-border">Settings</h3>
            <div className="divide-y divide-border">
              <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-accent transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div className="text-left flex-1">
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-muted-foreground">Enabled</p>
                </div>
              </button>
              <button
                onClick={handleArchive}
                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-accent transition-colors"
              >
                <Archive className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Archive chat</p>
                  <p className="text-sm text-muted-foreground">
                    Hide this conversation
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <h3 className="px-6 py-4 border-b border-border text-destructive">
              Danger Zone
            </h3>
            <div className="divide-y divide-border">
              <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-destructive">
                <Ban className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Block contact</p>
                  <p className="text-sm opacity-80">
                    You won't receive messages from this contact
                  </p>
                </div>
              </button>
              <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-destructive">
                <Trash2 className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Delete chat</p>
                  <p className="text-sm opacity-80">
                    Permanently delete this conversation
                  </p>
                </div>
              </button>
            </div>
          </div>

          {isGroup && (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <h3 className="px-6 py-4 border-b border-border">Participants</h3>
              <p className="px-6 py-4 text-sm text-muted-foreground">
                Open this conversation from the chat screen to manage members.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
