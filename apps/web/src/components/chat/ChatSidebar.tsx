import React, { useState } from 'react';
import { Search, Plus, LogOut, Moon, Sun, MessageCircle, Users, Megaphone, Settings, Phone } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { ConversationCard } from './ConversationCard';
import { NewChatModal } from './NewChatModal';
import { CreateGroupModal } from './CreateGroupModal';
import { CreateChannelModal } from './CreateChannelModal';

interface ChatSidebarProps {
  onOpenSettings?: () => void;
  onOpenCallHistory?: () => void;
  onOpenGlobalSearch?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onOpenSettings,
  onOpenCallHistory,
  onOpenGlobalSearch,
}) => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { chats, activeChatId, setActiveChatId } = useChatStore();

  const [filterTab, setFilterTab] = useState<'ALL' | 'DIRECT' | 'GROUP' | 'CHANNEL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isChannelOpen, setIsChannelOpen] = useState(false);

  const filteredChats = chats.filter((c) => {
    if (filterTab !== 'ALL' && c.type !== filterTab) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const recipientName = c.recipient?.username?.toLowerCase() || '';
    const groupName = c.name?.toLowerCase() || '';

    return recipientName.includes(query) || groupName.includes(query);
  });

  return (
    <div className="w-full md:w-80 lg:w-96 bg-card border-r border-border flex flex-col h-full flex-shrink-0">
      {/* Top Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-md">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-sky-400 bg-clip-text text-transparent">
              NexChat
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {onOpenCallHistory && (
              <button
                onClick={onOpenCallHistory}
                className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-[#2AABEE] transition"
                title="Call History"
              >
                <Phone className="w-4 h-4 text-[#2AABEE]" />
              </button>
            )}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
            </button>
            <button
              onClick={() => setIsGroupOpen(true)}
              className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition"
              title="New Group"
            >
              <Users className="w-4 h-4 text-sky-400" />
            </button>
            <button
              onClick={() => setIsChannelOpen(true)}
              className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition"
              title="New Channel"
            >
              <Megaphone className="w-4 h-4 text-amber-400" />
            </button>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="p-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition shadow-sm"
              title="New Direct Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chats or @users..."
            value={searchQuery}
            onClick={() => onOpenGlobalSearch && onOpenGlobalSearch()}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-accent/40 rounded-xl border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition cursor-pointer"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b border-border/40 pb-1">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`pb-1 border-b-2 transition ${
              filterTab === 'ALL' ? 'border-primary text-primary font-bold' : 'border-transparent hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterTab('DIRECT')}
            className={`pb-1 border-b-2 transition ${
              filterTab === 'DIRECT' ? 'border-primary text-primary font-bold' : 'border-transparent hover:text-foreground'
            }`}
          >
            Direct
          </button>
          <button
            onClick={() => setFilterTab('GROUP')}
            className={`pb-1 border-b-2 transition ${
              filterTab === 'GROUP' ? 'border-primary text-primary font-bold' : 'border-transparent hover:text-foreground'
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setFilterTab('CHANNEL')}
            className={`pb-1 border-b-2 transition ${
              filterTab === 'CHANNEL' ? 'border-primary text-primary font-bold' : 'border-transparent hover:text-foreground'
            }`}
          >
            Channels
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredChats.length > 0 ? (
          filteredChats.map((c) => (
            <ConversationCard
              key={c.id}
              chat={c}
              isActive={c.id === activeChatId}
              onClick={() => setActiveChatId(c.id)}
            />
          ))
        ) : (
          <div className="text-center py-10 text-xs text-muted-foreground space-y-2">
            <p>No conversations found</p>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="text-primary font-semibold hover:underline"
            >
              + Start a new chat
            </button>
          </div>
        )}
      </div>

      {/* Logged in user profile footer */}
      {user && (
        <div className="p-3 border-t border-border bg-accent/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <h5 className="text-xs font-bold truncate">@{user.username}</h5>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition"
                title="Settings & Privacy"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={logout}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
      <CreateGroupModal isOpen={isGroupOpen} onClose={() => setIsGroupOpen(false)} />
      <CreateChannelModal isOpen={isChannelOpen} onClose={() => setIsChannelOpen(false)} />
    </div>
  );
};

