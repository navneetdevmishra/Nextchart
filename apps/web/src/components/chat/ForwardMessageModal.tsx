import React, { useState } from 'react';
import { Forward, X, Check, Search, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

interface ForwardMessageModalProps {
  isOpen: boolean;
  messageIds: string[];
  onClose: () => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  messageIds,
  onClose,
}) => {
  const { accessToken } = useAuthStore();
  const { chats, addMessage } = useChatStore();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const filteredChats = chats.filter((c) => {
    if (!searchQuery.trim()) return true;
    const name = c.type === 'DIRECT' ? c.recipient?.username : c.name;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleForward = async () => {
    if (!selectedChatId || messageIds.length === 0) return;

    setIsForwarding(true);
    setError('');

    try {
      const forwardedMessages = await apiFetch<any[]>(
        `/chats/${selectedChatId}/forward`,
        {
          method: 'POST',
          body: JSON.stringify({ messageIds }),
        },
        accessToken,
      );

      forwardedMessages.forEach((msg) => addMessage(selectedChatId, msg));
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to forward messages');
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Forward className="w-5 h-5 text-sky-400" />
            Forward {messageIds.length} Message{messageIds.length > 1 ? 's' : ''}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-accent/40 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="max-h-60 overflow-y-auto space-y-1.5 py-1">
          {filteredChats.map((c) => {
            const isSelected = selectedChatId === c.id;
            const displayName = c.type === 'DIRECT' ? c.recipient?.username || 'User' : c.name;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedChatId(c.id)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                  isSelected ? 'bg-primary/20 border border-primary/50' : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                    {displayName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">@{displayName}</h4>
                    <span className="text-[11px] text-muted-foreground capitalize">{c.type.toLowerCase()}</span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-primary" />}
              </div>
            );
          })}
        </div>

        <button
          disabled={!selectedChatId || isForwarding}
          onClick={handleForward}
          className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {isForwarding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Forward'}
        </button>
      </div>
    </div>
  );
};
