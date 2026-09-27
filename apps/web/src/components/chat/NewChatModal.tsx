import React, { useState } from 'react';
import { Search, UserPlus, X, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { accessToken } = useAuthStore();
  const { addChat, setActiveChatId } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await apiFetch<any[]>(`/users/search?q=${encodeURIComponent(searchQuery)}`, {}, accessToken);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (recipientId: string) => {
    try {
      setIsLoading(true);
      const chat = await apiFetch<any>(
        '/chats/direct',
        {
          method: 'POST',
          body: JSON.stringify({ recipientId }),
        },
        accessToken,
      );
      addChat(chat);
      setActiveChatId(chat.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            New Direct Chat
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by @username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-accent/50 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </form>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="max-h-60 overflow-y-auto space-y-2 py-2">
          {isLoading ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            results.map((u) => (
              <div
                key={u.id}
                onClick={() => handleStartChat(u.id)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-accent cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">@{u.username}</h4>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <span className="text-xs text-primary font-medium">Message</span>
              </div>
            ))
          ) : searchQuery ? (
            <p className="text-center py-4 text-xs text-muted-foreground">No users found matching query</p>
          ) : (
            <p className="text-center py-4 text-xs text-muted-foreground">Type a handle to find contacts</p>
          )}
        </div>
      </div>
    </div>
  );
};
