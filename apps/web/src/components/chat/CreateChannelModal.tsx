import React, { useState } from 'react';
import { Megaphone, X, AtSign, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ isOpen, onClose }) => {
  const { accessToken } = useAuthStore();
  const { addChat, setActiveChatId } = useChatStore();

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const channelChat = await apiFetch<any>(
        '/channels',
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            handle,
            description,
            isPrivate: false,
          }),
        },
        accessToken,
      );

      addChat(channelChat);
      setActiveChatId(channelChat.id);
      onClose();
      setName('');
      setHandle('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create broadcast channel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-400" />
            New Broadcast Channel
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-accent">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <form onSubmit={handleCreateChannel} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Channel Name</label>
            <input
              type="text"
              required
              placeholder="e.g. NexChat Announcements"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-accent/40 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Channel Handle</label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                required
                placeholder="nexchat_updates"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-accent/40 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="What kind of updates do you broadcast?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-accent/40 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim() || !handle.trim()}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Broadcast Channel'}
          </button>
        </form>
      </div>
    </div>
  );
};
