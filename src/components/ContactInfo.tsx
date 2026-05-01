import {
  X,
  Phone,
  Video,
  Bell,
  BellOff,
  Ban,
  FileText,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { useConversations } from '../contexts/ConversationsContext';

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

  const handleViewFullProfile = () => {
    showFullProfile(true);
  };

  return (
    <div className="w-[320px] bg-card border-l border-border flex flex-col h-screen overflow-y-auto">
      <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
        <h3>Contact Info</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-accent rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={handleViewFullProfile}
        className="flex flex-col items-center p-6 border-b border-border hover:bg-accent/50 transition-colors"
      >
        <div className="w-24 h-24 rounded-full bg-muted overflow-hidden mb-4">
          {selectedConversation.avatar ? (
            <img
              src={selectedConversation.avatar}
              alt={selectedConversation.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {selectedConversation.name.charAt(0)}
            </div>
          )}
        </div>
        <h2>{selectedConversation.name}</h2>
        {!selectedConversation.isGroup && (
          <p className="text-sm text-muted-foreground mt-1">
            +1 (555) 123-4567
          </p>
        )}
        {selectedConversation.isGroup && (
          <p className="text-sm text-muted-foreground mt-1">
            {selectedConversation.participants.length} members
          </p>
        )}
        <div className="flex items-center gap-1 text-sm text-accent mt-2">
          View profile
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      <div className="p-4 border-b border-border">
        <h4 className="mb-3">About</h4>
        <p className="text-sm text-muted-foreground">
          Hey there! I am using Culver.
        </p>
      </div>

      <div className="p-4 border-b border-border">
        <div className="flex gap-4">
          <button className="flex-1 flex flex-col items-center gap-2 p-3 hover:bg-accent rounded-lg transition-colors">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <Phone className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-sm">Audio</span>
          </button>
          <button className="flex-1 flex flex-col items-center gap-2 p-3 hover:bg-accent rounded-lg transition-colors">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <Video className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-sm">Video</span>
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-border">
        <h4 className="mb-3">Media & Files</h4>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square bg-muted rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img
                src={`https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=200&h=200&fit=crop`}
                alt={`Media ${i}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        <button className="w-full mt-3 py-2 text-sm text-accent hover:underline">
          View All
        </button>
      </div>

      <div className="p-4 border-b border-border">
        <h4 className="mb-3">Shared Files</h4>
        <div className="space-y-2">
          {[
            { name: 'Design_Mockup.fig', size: '2.4 MB', date: 'Yesterday' },
            { name: 'Project_Brief.pdf', size: '1.1 MB', date: '2 days ago' },
          ].map((file, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.size} · {file.date}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2">
        <button className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span>Mute notifications</span>
        </button>
        <button
          onClick={() =>
            selectedConversation && archiveConversation(selectedConversation.id)
          }
          className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
        >
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
          <span>Archive chat</span>
        </button>
        <button className="w-full flex items-center gap-3 p-3 hover:bg-destructive/10 rounded-lg transition-colors text-destructive">
          <Ban className="w-5 h-5" />
          <span>Block contact</span>
        </button>
      </div>
    </div>
  );
}
