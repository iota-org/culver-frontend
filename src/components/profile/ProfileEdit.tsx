import { useState, useRef } from 'react';
import { X, Camera, User, AtSign, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadCurrentUserAvatar } from '../../services/authService';

interface ProfileEditProps {
  onClose: () => void;
}

export default function ProfileEdit({ onClose }: ProfileEditProps) {
  const { user, updateProfile, refreshProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    await updateProfile({ name, username, bio });
    onClose();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarPreview(URL.createObjectURL(file));
    setAvatarError(null);
    setIsUploadingAvatar(true);

    try {
      await uploadCurrentUserAvatar(file);
      await refreshProfile();
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : 'Failed to upload photo.',
      );
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const displayAvatar = avatarPreview ?? user?.avatar ?? null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2>Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-400 overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-[3px]">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
              aria-label="Upload profile photo"
            />
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-muted overflow-hidden">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {user?.name?.charAt(0)}
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                aria-label="Change profile photo"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {isUploadingAvatar
                ? 'Uploading…'
                : 'Click to update profile photo'}
            </p>
            {avatarError && (
              <p className="text-xs text-destructive mt-1">{avatarError}</p>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 mb-2 text-muted-foreground">
                <User className="w-4 h-4" />
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 text-muted-foreground">
                <AtSign className="w-4 h-4" />
                Username
              </label>
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
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                rows={3}
                maxLength={150}
                className="w-full px-4 py-3 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {bio.length}/150 characters
              </p>
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

        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              void handleSave();
            }}
            disabled={isUploadingAvatar}
            className="flex-1 px-4 py-3 bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isUploadingAvatar ? 'Uploading…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
