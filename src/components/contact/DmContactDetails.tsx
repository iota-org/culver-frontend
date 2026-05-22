import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Archive,
  Ban,
  Trash2,
  Loader2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useConversations } from '../../contexts/ConversationsContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  deleteConversation,
  getOtherConversationMemberProfile,
} from '../../services/conversationsService';
import type { UserProfile } from '../../services/usersService';

interface DMContactDetailsProps {
  onClose: () => void;
}

export default function DMContactDetails({ onClose }: DMContactDetailsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedConversation, archiveConversation } = useConversations();

  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const conv = selectedConversation;

  // Fetch the other member's profile
  useEffect(() => {
    if (!conv) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await getOtherConversationMemberProfile(
          conv.id,
          user?.id,
        );
        setOtherUser(profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact');
      } finally {
        setLoading(false);
      }
    };

    queueMicrotask(() => void load());
  }, [conv, conv?.id, user?.id]);

  if (!conv) return null;

  const displayName = otherUser?.name ?? conv.name ?? 'Unknown';

  const handleArchive = () => {
    archiveConversation(conv.id);
    onClose();
    navigate('/');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteConversation(conv.id);
      onClose();
      navigate('/');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete conversation',
      );
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-[3px]">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center gap-4 z-10">
        <button
          onClick={onClose}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-semibold">Contact Info</h2>
      </div>

      <div className="max-w-2xl mx-auto w-full p-6 space-y-5">
        {/* Profile card */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex flex-col items-center p-8 border-b border-border">
            {loading ? (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              </div>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-muted overflow-hidden mb-4 flex items-center justify-center">
                  {otherUser?.avatar_url ? (
                    <img
                      src={otherUser.avatar_url}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-semibold text-muted-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h2 className="font-bold text-xl">{displayName}</h2>
                {otherUser?.bio && (
                  <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
                    {otherUser.bio}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Contact details */}
          {!loading && otherUser && (
            <div className="divide-y divide-border">
              <div className="px-6 py-4 flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{otherUser.phone_number}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl p-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Quick actions */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            <button
              onClick={() => {
                onClose();
              }}
              className="w-full px-6 py-4 flex items-center gap-3 hover:bg-accent transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Message</p>
                <p className="text-sm text-muted-foreground">
                  Go to conversation
                </p>
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

        {/* Danger zone */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <p className="px-6 py-3 text-xs font-semibold text-destructive uppercase tracking-wider border-b border-border">
            Danger Zone
          </p>
          <div className="divide-y divide-border">
            <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-destructive">
              <Ban className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <p className="font-medium">Block contact</p>
                <p className="text-sm opacity-80">Stop receiving messages</p>
              </div>
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-destructive"
              >
                <Trash2 className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Delete conversation</p>
                  <p className="text-sm opacity-80">
                    Permanently remove this chat
                  </p>
                </div>
              </button>
            ) : (
              <div className="px-6 py-4 space-y-3">
                <p className="text-sm text-destructive font-medium">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 border border-border rounded-xl text-sm hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleDelete()}
                    disabled={isDeleting}
                    className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
