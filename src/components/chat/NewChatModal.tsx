import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Search,
  User,
  Users,
  Loader2,
  X,
  UserPlus,
  UserCheck,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import { useConversations } from '../../contexts/ConversationsContext';
import { useContacts } from '../../contexts/ContactsContext';
import { searchUserByPhone, type FoundUser } from '../../services/usersService';
import parsePhoneNumber, {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from 'libphonenumber-js';

type SearchState = 'idle' | 'loading' | 'found' | 'not_found' | 'error';

// Which "mode" the modal is in
type ModalMode = 'search' | 'group';

interface NewChatModalProps {
  children: React.ReactNode;
  onOpenConversation?: (conversationId: string) => void;
}

export default function NewChatModal({
  children,
  onOpenConversation,
}: NewChatModalProps) {
  const [open, setOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('search');

  // Search state
  const [query, setQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('NG');
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);

  // Group state (selecting multiple people)
  const [selectedUsers, setSelectedUsers] = useState<FoundUser[]>([]);
  const [groupName, setGroupName] = useState('');

  // Loading/error for actions
  const [addingContact, setAddingContact] = useState(false);
  const [addContactError, setAddContactError] = useState<string | null>(null);
  const [addContactSuccess, setAddContactSuccess] = useState(false);
  const [isCreatingConv, setIsCreatingConv] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { createConversation } = useConversations();
  const {
    addContact,
    isContact,
    // getContact
  } = useContacts();
  const debounceRef = useRef<number | null>(null);

  // Search

  const searchUser = async (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      setSearchState('idle');
      setFoundUser(null);
      setSearchError(null);
      return;
    }

    if (trimmed.length < 10) return;

    const parsedPhone = parsePhoneNumber(
      trimmed,
      selectedCountry as CountryCode,
    );
    if (!parsedPhone || !parsedPhone.isValid()) {
      setSearchError('Please enter a valid phone number.');
      return;
    }

    const formattedPhone = parsedPhone.format('E.164');
    setSearchState('loading');
    setFoundUser(null);
    setSearchError(null);
    setAddContactError(null);
    setAddContactSuccess(false);

    try {
      setFoundUser(await searchUserByPhone(formattedPhone));
      setSearchState('found');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        setSearchState('not_found');
        setSearchError('No user found with that phone number.');
      } else {
        setSearchState('error');
        setSearchError('Something went wrong. Please try again.');
      }
      setFoundUser(null);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setAddContactError(null);
    setAddContactSuccess(false);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void searchUser(value);
    }, 500);
  };

  // Add to group (for group mode)

  const addToGroup = (user: FoundUser) => {
    if (selectedUsers.some((u) => u.id === user.id)) return;
    setSelectedUsers((prev) => [...prev, user]);
    setQuery('');
    setFoundUser(null);
    setSearchState('idle');
    setSearchError(null);
  };

  const removeFromGroup = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Add Contact

  const handleAddContact = async (user: FoundUser) => {
    setAddingContact(true);
    setAddContactError(null);
    setAddContactSuccess(false);
    try {
      await addContact(user.id, user.name);
      setAddContactSuccess(true);
    } catch (err) {
      setAddContactError(
        err instanceof Error ? err.message : 'Failed to add contact.',
      );
    } finally {
      setAddingContact(false);
    }
  };

  // Message (direct)

  const handleMessageUser = async (user: FoundUser) => {
    setIsCreatingConv(true);
    setCreateError(null);
    try {
      const newId = await createConversation({
        type: 'direct',
        member_ids: [user.id],
      });
      onOpenConversation?.(newId);
      handleClose();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Failed to open conversation.',
      );
    } finally {
      setIsCreatingConv(false);
    }
  };

  // Create group

  const handleCreateGroup = async () => {
    if (selectedUsers.length < 2) return;
    if (!groupName.trim()) {
      setCreateError('Group name is required');
      return;
    }

    setIsCreatingConv(true);
    setCreateError(null);

    try {
      const newId = await createConversation({
        type: 'group',
        member_ids: selectedUsers.map((u) => u.id),
        name: groupName.trim(),
      });
      onOpenConversation?.(newId);
      handleClose();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Failed to create group.',
      );
    } finally {
      setIsCreatingConv(false);
    }
  };

  // Close / reset 

  const handleClose = () => {
    setOpen(false);
    setModalMode('search');
    setQuery('');
    setSelectedCountry('NG');
    setSearchState('idle');
    setSearchError(null);
    setFoundUser(null);
    setSelectedUsers([]);
    setGroupName('');
    setCreateError(null);
    setAddContactError(null);
    setAddContactSuccess(false);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
  };

  // Render

  const searchSection = (
    <div className="space-y-4">
      {/* Group: show chips of selected users */}
      {modalMode === 'group' && selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((u) => (
            <span
              key={u.id}
              className="flex items-center gap-1.5 bg-accent text-accent-foreground text-sm px-3 py-1 rounded-full"
            >
              <div className="w-5 h-5 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {u.avatar_url ? (
                  <img
                    src={u.avatar_url}
                    alt={u.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-medium">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {u.name}
              <button
                onClick={() => removeFromGroup(u.id)}
                className="ml-0.5 hover:opacity-70 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Country + Phone input */}
      <div className="flex items-center gap-2">
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="px-2 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
        >
          {getCountries().map((country) => (
            <option key={country} value={country}>
              +{getCountryCallingCode(country as CountryCode)}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          {searchState === 'loading' && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
          )}
          <input
            type="text"
            placeholder="Search by phone number…"
            value={query}
            onChange={handleQueryChange}
            className="w-full pl-10 pr-10 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
        </div>
      </div>

      {/* Found user card */}
      {searchState === 'found' &&
        foundUser &&
        (() => {
          const alreadyContact = isContact(foundUser.id);
          // const existingContact = getContact(foundUser.id);
          const inGroup = selectedUsers.some((u) => u.id === foundUser.id);

          return (
            <div className="rounded-lg border border-border overflow-hidden">
              {/* User info row */}
              <div className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {foundUser.avatar_url ? (
                    <img
                      src={foundUser.avatar_url}
                      alt={foundUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-medium text-muted-foreground">
                      {foundUser.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{foundUser.name}</p>
                  {foundUser.bio && (
                    <p className="text-sm text-muted-foreground truncate">
                      {foundUser.bio}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                    {foundUser.phone_number}
                  </p>
                </div>
                {alreadyContact && (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
                    <UserCheck className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
              </div>

              {/* Action buttons */}
              {modalMode === 'search' ? (
                <div className="flex border-t border-border divide-x divide-border">
                  {/* Add Contact */}
                  <button
                    onClick={() => void handleAddContact(foundUser)}
                    disabled={
                      addingContact || alreadyContact || addContactSuccess
                    }
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingContact ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : alreadyContact || addContactSuccess ? (
                      <UserCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <UserPlus className="w-4 h-4 text-muted-foreground" />
                    )}
                    {alreadyContact || addContactSuccess
                      ? 'Saved'
                      : 'Add Contact'}
                  </button>

                  {/* Message */}
                  <button
                    onClick={() => void handleMessageUser(foundUser)}
                    disabled={isCreatingConv}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm hover:bg-accent transition-colors disabled:opacity-50"
                  >
                    {isCreatingConv ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                    Message
                  </button>
                </div>
              ) : (
                /* Group mode: single "Add to group" button */
                <div className="border-t border-border">
                  <button
                    onClick={() => addToGroup(foundUser)}
                    disabled={inGroup}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inGroup ? (
                      <>
                        <UserCheck className="w-4 h-4 text-green-500" />
                        Added
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 text-muted-foreground" />
                        Add to group
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Inline errors/success for add contact */}
              {addContactError && (
                <p className="text-xs text-destructive text-center pb-2 px-3">
                  {addContactError}
                </p>
              )}
            </div>
          );
        })()}

      {/* Not found / error */}
      {(searchState === 'not_found' || searchState === 'error') &&
        searchError && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {searchError}
          </div>
        )}

      {/* Empty state */}
      {searchState === 'idle' && selectedUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <User className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm">Search by phone number to find someone</p>
          <p className="text-xs mt-1 opacity-60">e.g. +2348011029924</p>
        </div>
      )}

      {/* Group: name input + create button */}
      {modalMode === 'group' && selectedUsers.length >= 2 && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Group name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name…"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {createError && (
            <p className="text-sm text-destructive text-center">
              {createError}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              {selectedUsers.length} people · Group chat
            </span>
            <button
              onClick={() => void handleCreateGroup()}
              disabled={isCreatingConv || !groupName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium"
            >
              {isCreatingConv && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCreatingConv ? 'Creating…' : 'Create group'}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => (o ? setOpen(true) : handleClose())}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {modalMode === 'group' ? 'New Group' : 'New Chat'}
          </DialogTitle>
          <DialogDescription>
            {modalMode === 'group'
              ? 'Add at least 2 people by phone number, then name the group'
              : 'Search by phone number to message or save someone'}
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex rounded-xl bg-muted p-1">
          <button
            onClick={() => {
              setModalMode('search');
              setSelectedUsers([]);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              modalMode === 'search'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Direct
          </button>
          <button
            onClick={() => setModalMode('group')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              modalMode === 'group'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Group
          </button>
        </div>

        {searchSection}
      </DialogContent>
    </Dialog>
  );
}
