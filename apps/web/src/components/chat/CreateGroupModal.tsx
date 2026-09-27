import React, { useState } from 'react';
import { Users, X, Search, Check, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { accessToken } = useAuthStore();
  const { addChat, setActiveChatId } = useChatStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await apiFetch<any[]>(`/users/search?q=${encodeURIComponent(query)}`, {}, accessToken);
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelectUser = (username: string) => {
    setSelectedUsernames((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username],
    );
  };

  const handleCreateGroup = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    setError('');

    try {
      const groupChat = await apiFetch<any>(
        '/groups',
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            description,
            isPrivate: true,
            memberUsernames: selectedUsernames,
          }),
        },
        accessToken,
      );

      addChat(groupChat);
      setActiveChatId(groupChat.id);
      onClose();
      setStep(1);
      setName('');
      setSelectedUsernames([]);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {step === 1 ? 'Create New Group' : 'Add Members'}
          </h3>
          <button
            onClick={() => { onClose(); setStep(1); }}
            className="p-1 rounded-lg text-muted-foreground hover:bg-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Group Name</label>
              <input
                type="text"
                required
                placeholder="e.g. NexChat Dev Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-accent/40 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="What is this group about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-accent/40 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none"
              />
            </div>

            <button
              disabled={!name.trim()}
              onClick={() => setStep(2)}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50 text-sm"
            >
              Next: Select Members
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search handle to add..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-accent/40 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1 py-1">
              {searchResults.map((u) => {
                const isSelected = selectedUsernames.includes(u.username);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleSelectUser(u.username)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                      isSelected ? 'bg-primary/20 border border-primary/40' : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold">@{u.username}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 bg-accent hover:bg-accent/80 text-foreground font-semibold rounded-xl text-sm transition"
              >
                Back
              </button>
              <button
                disabled={isLoading}
                onClick={handleCreateGroup}
                className="w-2/3 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Group'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
