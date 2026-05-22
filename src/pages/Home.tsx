import { useState } from 'react';
import Sidebar from '../components/layout/SideBar';
import ChatPanel from '../components/chat/ChatPanel';
import ContactInfo from '../components/contact/ContactInfo';
import ContactsPanel from '../components/contact/ContactsPanel';
import DMContactDetails from '../components/contact/DmContactDetails';
import GroupContactDetails from '../components/contact/GroupContactDetails';
import { useConversations } from '../contexts/ConversationsContext';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../components/ui/resizable';
import Navbar from '../components/layout/Navbar';

export default function MainChat() {
  const { selectConversation, selectedConversation } = useConversations();

  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'chats' | 'archived' | 'calls' | 'contacts'
  >('chats');

  const resetContactView = () => {
    setShowContactInfo(false);
    setShowFullProfile(false);
  };

  const openConversation = (conversationId: string) => {
    resetContactView();
    setActiveTab('chats');
    selectConversation(conversationId);
  };

  const handleSetActiveTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'contacts') resetContactView();
  };

  // Render the right full-page detail based on conversation type
  const renderFullProfile = () => {
    if (!selectedConversation) return null;
    if (selectedConversation.type === 'group') {
      return <GroupContactDetails onClose={() => setShowFullProfile(false)} />;
    }
    return <DMContactDetails onClose={() => setShowFullProfile(false)} />;
  };

  return (
    <div className="flex h-screen overflow-hidden flex-col xl:flex-row">
      <div className="hidden xl:block">
        <Navbar activeTab={activeTab} setActiveTab={handleSetActiveTab} />
      </div>

      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel
          defaultSize={'22.5rem'}
          minSize={'20rem'}
          maxSize={'40rem'}
        >
          {activeTab === 'contacts' ? (
            <ContactsPanel
              resetContactView={resetContactView}
              onOpenConversation={openConversation}
            />
          ) : (
            <Sidebar
              resetContactView={resetContactView}
              activeTab={activeTab}
              onOpenConversation={openConversation}
            />
          )}
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="focus-visible:ring-transparent"
        />

        <ResizablePanel className="flex">
          {activeTab === 'contacts' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 p-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center opacity-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1M7 8H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h3a2 2 0 002-2V8a2 2 0 00-2-2H7z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium">Select a contact to message</p>
              <p className="text-xs opacity-60 text-center max-w-xs">
                Tap the message icon next to any contact, or use New Chat to
                find someone by phone number.
              </p>
            </div>
          ) : showFullProfile && selectedConversation ? (
            renderFullProfile()
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

      <div className="xl:hidden">
        <Navbar activeTab={activeTab} setActiveTab={handleSetActiveTab} />
      </div>
    </div>
  );
}
