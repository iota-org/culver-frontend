import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Lock,
  Smartphone,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center gap-4 z-10">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1>Settings</h1>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <h3 className="px-6 py-4 border-b border-border">Appearance</h3>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Sun className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">
                      {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <h3 className="px-6 py-4 border-b border-border">Notifications</h3>
            <div className="divide-y divide-border">
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Message notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Show previews in notifications
                    </p>
                  </div>
                </div>
                <button className="relative w-14 h-8 rounded-full bg-accent">
                  <div className="absolute top-1 translate-x-7 w-6 h-6 bg-white rounded-full shadow" />
                </button>
              </div>
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sound</p>
                    <p className="text-sm text-muted-foreground">
                      Play sound for messages
                    </p>
                  </div>
                </div>
                <button className="relative w-14 h-8 rounded-full bg-accent">
                  <div className="absolute top-1 translate-x-7 w-6 h-6 bg-white rounded-full shadow" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <h3 className="px-6 py-4 border-b border-border">
              Privacy & Security
            </h3>
            <div className="divide-y divide-border">
              <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-accent transition-colors">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Two-step verification</p>
                  <p className="text-sm text-muted-foreground">
                    Add extra security to your account
                  </p>
                </div>
              </button>
              <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-accent transition-colors">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Privacy</p>
                  <p className="text-sm text-muted-foreground">
                    Last seen, profile photo, bio
                  </p>
                </div>
              </button>
              <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-accent transition-colors">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Linked devices</p>
                  <p className="text-sm text-muted-foreground">
                    Manage your connected devices
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <button
              onClick={() => {
                void handleLogout();
              }}
              className="w-full px-6 py-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-destructive"
            >
              <LogOut className="w-5 h-5" />
              <p className="font-medium">Log out</p>
            </button>
          </div>

          <div className="text-center text-sm text-muted-foreground py-6">
            <p>Culver v1.0.0</p>
            <p className="mt-1">End-to-end encrypted messaging</p>
          </div>
        </div>
      </div>
    </div>
  );
}
