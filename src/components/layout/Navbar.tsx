import { useNavigate } from 'react-router';
import { Archive, MessageCircle, Phone, Settings, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  activeTab: 'chats' | 'archived' | 'calls' | 'contacts';
  setActiveTab: (tab: 'chats' | 'archived' | 'calls' | 'contacts') => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const tabs = [
    { id: 'chats' as const, icon: MessageCircle, label: 'Chats' },
    { id: 'contacts' as const, icon: Users, label: 'Contacts' },
    { id: 'archived' as const, icon: Archive, label: 'Archived' },
    { id: 'calls' as const, icon: Phone, label: 'Calls' },
  ];

  return (
    <div className="h-full xl:w-14 flex flex-row xl:flex-col items-center xl:py-6 p-2 bg-card border-r border-border">
      <div className="flex flex-row xl:flex-col items-center gap-4 justify-evenly xl:justify-start w-full xl:h-full">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            title={label}
            className={`flex items-center justify-center gap-2 p-2 text-sm transition-colors rounded-xl border-2 border-transparent ${
              activeTab === id
                ? 'text-sidebar-primary bg-sidebar-accent'
                : 'text-muted-foreground hover:text-sidebar-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}

        {/* Settings + Profile — mobile only */}
        <>
          <button
            onClick={() => navigate('/settings')}
            title="Settings"
            className="justify-self-end flex items-center justify-center gap-2 p-2 text-sm transition-colors rounded-xl border-2 border-transparent hover:bg-sidebar-accent xl:hidden"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/profile')}
            title="Profile"
            className="justify-self-end flex items-center justify-center gap-2 p-1 text-sm transition-colors rounded-xl border-2 border-transparent hover:bg-sidebar-accent xl:hidden"
          >
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>
          </button>
        </>
      </div>

      {/* Settings + Profile — desktop */}
      <div className="hidden xl:flex flex-row xl:flex-col items-center gap-4">
        <button
          onClick={() => navigate('/settings')}
          title="Settings"
          className="justify-self-end flex items-center justify-center gap-2 p-2 text-sm transition-colors rounded-xl border-2 border-transparent hover:bg-sidebar-accent"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate('/profile')}
          title="Profile"
          className="justify-self-end flex items-center justify-center gap-2 p-1 text-sm transition-colors rounded-xl border-2 border-transparent hover:bg-sidebar-accent"
        >
          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
