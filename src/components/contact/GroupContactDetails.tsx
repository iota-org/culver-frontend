import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Archive,
  Trash2,
  Loader2,
  AlertCircle,
  UserPlus,
  UserMinus,
  Shield,
  ShieldOff,
  LogOut,
  Users,
  MoreVertical,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useConversations } from '../../contexts/ConversationsContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  deleteConversation,
  getConversationMembersWithProfiles,
  removeConversationMember,
  updateConversationMemberRole,
  updateConversationName,
} from '../../services/conversationsService';
import type { MemberRole, MemberWithProfile } from '../../types';

interface GroupContactDetailsProps {
  onClose: () => void;
}

export default function GroupContactDetails({
  onClose,
}: GroupContactDetailsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedConversation, archiveConversation } = useConversations();

  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing group name
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Member action menu
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // user_id being acted on

  // Leave / delete
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDangerLoading, setIsDangerLoading] = useState(false);

  const conv = selectedConversation;
  const myMembership = members.find((m) => m.user_id === user?.id);
  const amAdmin = myMembership?.role === 'admin';

  // Data fetching

  const fetchMembers = useCallback(async () => {
    if (!conv) return;
    setLoading(true);
    setError(null);
    try {
      setMembers(await getConversationMembersWithProfiles(conv.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [conv]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchMembers();
      setGroupName(conv?.name ?? '');
    });
  }, [conv?.name, fetchMembers]);

  if (!conv) return null;

  // Actions

  const handleSaveName = async () => {
    if (!groupName.trim() || groupName.trim() === conv.name) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await updateConversationName(conv.id, groupName.trim());
      setIsEditingName(false);
      // optimistic update before conversation context refresh
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update group name',
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    setActionLoading(targetUserId);
    setOpenMenuUserId(null);
    try {
      await removeConversationMember(conv.id, targetUserId);
      setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (
    targetUserId: string,
    currentRole: MemberRole,
  ) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    setActionLoading(targetUserId);
    setOpenMenuUserId(null);
    try {
      await updateConversationMemberRole(conv.id, targetUserId, newRole);
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === targetUserId ? { ...m, role: newRole } : m,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    setIsDangerLoading(true);
    try {
      await removeConversationMember(conv.id, user.id);
      onClose();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave group');
    } finally {
      setIsDangerLoading(false);
      setConfirmLeave(false);
    }
  };

  const handleDelete = async () => {
    setIsDangerLoading(true);
    try {
      await deleteConversation(conv.id);
      onClose();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
    } finally {
      setIsDangerLoading(false);
      setConfirmDelete(false);
    }
  };

  const handleArchive = () => {
    archiveConversation(conv.id);
    onClose();
    navigate('/');
  };

  // Render

  return (
    <div
      className="flex-1 flex flex-col bg-background overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-[3px]"
      onClick={() => setOpenMenuUserId(null)}
    >
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center gap-4 z-10">
        <button
          onClick={onClose}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-semibold">Group Info</h2>
      </div>

      <div className="max-w-2xl mx-auto w-full p-6 space-y-5">
        {/* Group identity card */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex flex-col items-center p-8 border-b border-border">
            <div className="w-24 h-24 rounded-full bg-muted overflow-hidden mb-4 flex items-center justify-center">
              {conv.avatar_url ? (
                <img
                  src={conv.avatar_url}
                  alt={conv.name ?? ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold text-muted-foreground">
                  {(conv.name ?? 'G').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Group name — editable for admins */}
            {isEditingName ? (
              <div className="flex items-center gap-2 w-full max-w-xs">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  autoFocus
                  className="flex-1 px-3 py-1.5 border border-input rounded-lg text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-ring text-center"
                />
                <button
                  onClick={() => void handleSaveName()}
                  disabled={isSavingName}
                  className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {isSavingName ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setGroupName(conv.name ?? '');
                  }}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-xl">{conv.name ?? 'Group'}</h2>
                {amAdmin && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl p-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Members list */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Members</h3>
            {amAdmin && (
              <button
                className="flex items-center gap-1.5 text-sm text-sidebar-primary hover:opacity-80 transition-opacity"
                // Add member flow — hook up to NewChatModal or a phone search sheet
              >
                <UserPlus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading members…</span>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map((m) => {
                const isMe = m.user_id === user?.id;
                const isActing = actionLoading === m.user_id;
                const menuOpen = openMenuUserId === m.user_id;

                return (
                  <div
                    key={m.user_id}
                    className="px-6 py-3 flex items-center gap-3 relative"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center text-muted-foreground font-medium">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt={m.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{m.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {m.name}
                          {isMe && (
                            <span className="text-muted-foreground font-normal">
                              {' '}
                              (you)
                            </span>
                          )}
                        </p>
                        {m.role === 'admin' && (
                          <span className="text-[10px] font-semibold bg-sidebar-primary/15 text-sidebar-primary px-1.5 py-0.5 rounded-full shrink-0">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {m.phone_number}
                      </p>
                    </div>

                    {/* Action */}
                    {isActing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                    ) : amAdmin && !isMe ? (
                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuUserId(menuOpen ? null : m.user_id);
                          }}
                          className="p-1 hover:bg-accent rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>

                        {menuOpen && (
                          <div
                            className="absolute right-0 top-8 w-48 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() =>
                                void handleToggleRole(m.user_id, m.role)
                              }
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent transition-colors text-left"
                            >
                              {m.role === 'admin' ? (
                                <>
                                  <ShieldOff className="w-4 h-4 text-muted-foreground" />{' '}
                                  Remove admin
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 text-muted-foreground" />{' '}
                                  Make admin
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => void handleRemoveMember(m.user_id)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left border-t border-border"
                            >
                              <UserMinus className="w-4 h-4" /> Remove from
                              group
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            <button
              onClick={handleArchive}
              className="w-full px-6 py-4 flex items-center gap-3 hover:bg-accent transition-colors"
            >
              <Archive className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-medium">Archive group</p>
                <p className="text-sm text-muted-foreground">
                  Hide from chat list
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
            {/* Leave group */}
            {!confirmLeave ? (
              <button
                onClick={() => setConfirmLeave(true)}
                className="w-full px-6 py-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-destructive"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Leave group</p>
                  <p className="text-sm opacity-80">
                    You won't receive messages anymore
                  </p>
                </div>
              </button>
            ) : (
              <div className="px-6 py-4 space-y-3">
                <p className="text-sm text-destructive font-medium">
                  Leave this group?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmLeave(false)}
                    className="flex-1 py-2 border border-border rounded-xl text-sm hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleLeave()}
                    disabled={isDangerLoading}
                    className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDangerLoading && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Leave
                  </button>
                </div>
              </div>
            )}

            {/* Delete group — admins only */}
            {amAdmin &&
              (!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full px-6 py-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-destructive"
                >
                  <Trash2 className="w-5 h-5 shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Delete group</p>
                    <p className="text-sm opacity-80">
                      Permanently remove for everyone
                    </p>
                  </div>
                </button>
              ) : (
                <div className="px-6 py-4 space-y-3">
                  <p className="text-sm text-destructive font-medium">
                    Delete this group for everyone? This cannot be undone.
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
                      disabled={isDangerLoading}
                      className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isDangerLoading && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
