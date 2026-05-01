import { useState } from 'react';
import {
  MessageCircle,
  Phone,
  Search,
  MessageSquarePlus,
  EllipsisVertical,
} from 'lucide-react';
import { useConversations } from '../contexts/ConversationsContext';
import { useNavigate } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import logoDark from '../assets/culver/isolated-monochrome-black.svg';
import logoLight from '../assets/culver/isolated-monochrome-white.svg';
import NewChatModal from './NewChatModal';

interface SidebarProps {
  resetContactView: () => void;
  activeTab: 'chats' | 'archived' | 'calls';
}

export default function Sidebar({ resetContactView, activeTab }: SidebarProps) {
  const { theme } = useTheme();
  const logo = theme === 'light' ? logoDark : logoLight;
  console.log(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const { conversations, selectConversation, selectedConversation } =
    useConversations();
  const navigate = useNavigate();
  const [activeGroup, setActiveGroup] = useState<'all' | 'unread' | 'groups'>(
    'all',
  );

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'archived' ? c.isArchived : !c.isArchived;
    return matchesSearch && matchesTab;
  });

  const handleConversationClick = (id: string) => {
    resetContactView();
    selectConversation(id);
    navigate(`/chat/${id}`);
  };

  return (
    <div className="bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <div className="py-2 px-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-3 mb-4">
          <img src={logo} alt="Culver" className="w-16 h-6" />
          {/* <span className="font-semibold text-sidebar-foreground">Culver</span> */}
          <div className="flex gap-4">
            <div>
              <NewChatModal>
                <button className="p-2 text-muted-foreground rounded-full border-border cursor-pointer hover:text-sidebar-foreground transition-colors">
                  <MessageSquarePlus className="w-5 h-5 text-sidebar-foreground" />
                </button>
              </NewChatModal>
            </div>
            <div className="p-2 text-muted-foreground rounded-full border-border cursor-pointer hover:text-sidebar-foreground transition-colors">
              <EllipsisVertical className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-sidebar-accent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
          />
        </div>
      </div>

      <div className="flex border-b border-sidebar-border gap-4 px-4 py-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveGroup('all')}
          className={`h-fit py-1 px-4 text-sm border rounded-full transition-colors ${
            activeGroup === 'all'
              ? 'text-sidebar-primary border-b-2 border-sidebar-primary'
              : 'text-muted-foreground hover:text-sidebar-foreground'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveGroup('unread')}
          className={`flex gap-2 items-center h-fit py-1 px-4 text-sm border rounded-full transition-colors ${
            activeGroup === 'unread'
              ? 'text-sidebar-primary border-b-2 border-sidebar-primary'
              : 'text-muted-foreground hover:text-sidebar-foreground'
          }`}
        >
          Unread <span className="text-xs text-white rounded-full">3</span>
        </button>
        <button
          onClick={() => setActiveGroup('groups')}
          className={`flex gap-2 items-center h-fit py-1 px-4 text-sm border rounded-full transition-colors ${
            activeGroup === 'groups'
              ? 'text-sidebar-primary border-b-2 border-sidebar-primary'
              : 'text-muted-foreground hover:text-sidebar-foreground'
          }`}
        >
          Groups <span className="text-xs text-white rounded-full">3</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'calls' ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <Phone className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No recent calls</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No conversations</p>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleConversationClick(conv.id)}
                className={`w-full p-3 flex items-start gap-3 hover:bg-sidebar-accent transition-colors border-b border-sidebar-border relative ${
                  selectedConversation?.id === conv.id
                    ? 'bg-sidebar-accent'
                    : ''
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                    {conv.avatar ? (
                      <img
                        src={conv.avatar}
                        alt={conv.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {conv.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  {conv.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-sidebar rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sidebar-foreground truncate">
                      {conv.name}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatDistanceToNow(conv.lastMessage.timestamp, {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <div className="shrink-0 ml-2 w-5 h-5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-xs absolute top-1/2 -translate-y-1/2 right-3">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
