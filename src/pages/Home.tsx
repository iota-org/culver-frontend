import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import Sidebar from '../components/SideBar';
import ChatPanel from '../components/ChatPanel';
import ContactInfo from '../components/ContactInfo';
import { useConversations } from '../contexts/ConversationsContext';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../components/ui/resizable';
import ContactDetails from './ContactDetails';
import { Archive, MessageCircle, Phone, Settings } from 'lucide-react';

export default function MainChat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { selectConversation, selectedConversation } = useConversations();
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'archived' | 'calls'>(
    'chats',
  );

  // Sync URL parameter with selected conversation
  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId, selectConversation]); // Only depend on conversationId, not selectConversation

  const handleProfileClick = () => {
    navigate('/profile');
  };
  const resetContactView = () => {
    setShowContactInfo(false);
    setShowFullProfile(false);
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <div className="h-full w-14 flex flex-col items-center justify-between py-6 bg-card border-r border-border">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setActiveTab('chats')}
              title="Chats"
              className={`flex items-center justify-center gap-2 p-2 text-sm transition-colors rounded-xl border-2 border-transparent ${
                activeTab === 'chats'
                  ? 'text-sidebar-primary bg-sidebar-accent'
                  : 'text-muted-foreground hover:text-sidebar-foreground'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              title="Archived"
              className={`flex items-center justify-center gap-2 p-2 text-sm transition-colors rounded-xl border-2 border-transparent ${
                activeTab === 'archived'
                  ? 'text-sidebar-primary bg-sidebar-accent'
                  : 'text-muted-foreground hover:text-sidebar-foreground'
              }`}
            >
              <Archive className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              title="Calls"
              className={`justify-self-end flex items-center justify-center gap-2 p-2 text-sm transition-colors rounded-xl border-2 border-transparent ${
                activeTab === 'calls'
                  ? 'text-sidebar-primary bg-sidebar-accent'
                  : 'text-muted-foreground hover:text-sidebar-foreground'
              }`}
            >
              <Phone className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => navigate('/settings')}
              title="Settings"
              className={`justify-self-end flex items-center justify-center gap-2 p-2 text-sm transition-colors rounded-xl border-2 border-transparent hover:bg-sidebar-accent`}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleProfileClick()}
              title="Profile"
              className={`justify-self-end flex items-center justify-center gap-2 p-1 text-sm transition-colors rounded-xl border-2 border-transparent hover:bg-sidebar-accent`}
            >
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                  alt="You"
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          </div>
        </div>
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel
            defaultSize={'22.5rem'}
            minSize={'20rem'}
            maxSize={'40rem'}
          >
            <Sidebar
              resetContactView={resetContactView}
              activeTab={activeTab}
            />
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className="focus-visible:ring-transparent"
          />
          <ResizablePanel className="flex">
            {showFullProfile ? (
              <ContactDetails onClose={() => setShowFullProfile(false)} />
            ) : (
              <>
                <ChatPanel
                  toggleContactInfo={() => setShowContactInfo((prev) => !prev)}
                />
                {showContactInfo && selectedConversation && (
                  <ContactInfo
                    onClose={() => setShowContactInfo(false)}
                    showFullProfile={setShowFullProfile}
                  />
                )}
              </>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
