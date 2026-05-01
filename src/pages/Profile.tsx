import { useState } from 'react';
import { ArrowLeft, Camera, User, AtSign, FileText } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [about, setAbout] = useState(user?.about || '');

  const handleSave = () => {
    updateProfile({ name, username, about });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setUsername(user?.username || '');
    setAbout(user?.about || '');
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1>Profile</h1>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-opacity"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-border rounded-xl hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex flex-col items-center p-8 border-b border-border">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-muted overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {user?.name.charAt(0)}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
                    <Camera className="w-5 h-5" />
                  </button>
                )}
              </div>
              {isEditing && (
                <p className="text-sm text-muted-foreground mt-3">
                  Click to update profile photo
                </p>
              )}
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <p className="px-4 py-3">{name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <AtSign className="w-4 h-4" />
                  Username
                </label>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      People can find you with @{username || 'username'}
                    </p>
                  </>
                ) : (
                  <p className="px-4 py-3">@{username || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  About
                </label>
                {isEditing ? (
                  <>
                    <textarea
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      placeholder="Tell people about yourself..."
                      rows={3}
                      maxLength={150}
                      className="w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      {about.length}/150 characters
                    </p>
                  </>
                ) : (
                  <p className="px-4 py-3">{about || 'Not set'}</p>
                )}
              </div>

              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <p className="text-sm mb-2">Phone Number</p>
                <p className="font-medium">
                  {user?.phone_number || '+1 (555) 000-0000'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Your phone number is verified and cannot be changed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
