import {
  X,
  Bell,
  Archive,
  Ban,
  ChevronRight,
  Phone,
  Video,
  Users,
} from 'lucide-react';
import { useConversations } from '../../contexts/ConversationsContext';

interface ContactInfoProps {
  onClose: () => void;
  showFullProfile: (show: boolean) => void;
}

export default function ContactInfo({
  onClose,
  showFullProfile,
}: ContactInfoProps) {
  const { selectedConversation, archiveConversation } = useConversations();

  if (!selectedConversation) return null;

  const isGroup = selectedConversation.type === 'group';
  const displayName = selectedConversation.name ?? 'Unknown';

  return (
    <div className="w-75 shrink-0 bg-card border-l border-border flex flex-col h-full overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-[3px]">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
        <h3 className="font-medium">
          {isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-accent rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Avatar + name — tapping opens full detail */}
      <button
        onClick={() => showFullProfile(true)}
        className="flex flex-col items-center p-6 border-b border-border hover:bg-accent/50 transition-colors w-full"
      >
        <div className="w-20 h-20 rounded-full bg-muted overflow-hidden mb-3 flex items-center justify-center">
          {selectedConversation.avatar_url ? (
            <img
              src={selectedConversation.avatar_url}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-foreground font-semibold text-2xl">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <p className="font-semibold text-base">{displayName}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {isGroup ? 'Group' : 'Direct message'}
        </p>
        <span className="flex items-center gap-1 text-xs text-sidebar-primary mt-2">
          {isGroup ? 'View group info' : 'View profile'}
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </button>

      {/* Quick actions */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-3">
          {!isGroup && (
            <button className="flex-1 flex flex-col items-center gap-1.5 p-3 hover:bg-accent rounded-xl transition-colors">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                <Phone className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="text-xs">Audio</span>
            </button>
          )}
          <button className="flex-1 flex flex-col items-center gap-1.5 p-3 hover:bg-accent rounded-xl transition-colors">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
              <Video className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="text-xs">Video</span>
          </button>
          {isGroup && (
            <button
              onClick={() => showFullProfile(true)}
              className="flex-1 flex flex-col items-center gap-1.5 p-3 hover:bg-accent rounded-xl transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                <Users className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="text-xs">Members</span>
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-1">
        <button className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-xl transition-colors text-left">
          <Bell className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm">Mute notifications</span>
        </button>
        <button
          onClick={() => archiveConversation(selectedConversation.id)}
          className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-xl transition-colors text-left"
        >
          <Archive className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm">Archive chat</span>
        </button>
        {!isGroup && (
          <button className="w-full flex items-center gap-3 p-3 hover:bg-destructive/10 rounded-xl transition-colors text-destructive text-left">
            <Ban className="w-4 h-4 shrink-0" />
            <span className="text-sm">Block contact</span>
          </button>
        )}
      </div>
    </div>
  );
}
