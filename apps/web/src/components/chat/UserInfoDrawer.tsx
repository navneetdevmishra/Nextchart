import React from 'react';
import { X, Moon, Sun, Bell, Shield, Image, FileText, Link2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ChatDto } from '@nexchat/shared';

interface UserInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatDto;
}

export const UserInfoDrawer: React.FC<UserInfoDrawerProps> = ({ isOpen, onClose, chat }) => {
  const { theme, setTheme } = useTheme();
  const recipient = chat.recipient;

  if (!isOpen) return null;

  const displayName = chat.type === 'DIRECT' ? recipient?.username || 'User' : chat.name || 'Group Chat';
  const bio = recipient?.bio || 'Hey there! I am using NexChat.';
  const email = recipient?.email;

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-bold text-sm">User Info</h3>
        <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-accent">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Card */}
      <div className="p-6 flex flex-col items-center border-b border-border text-center">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/20 text-primary text-3xl font-bold flex items-center justify-center mb-3">
          {recipient?.avatarUrl ? (
            <img src={recipient.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <h2 className="font-bold text-lg">@{displayName}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{email}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full">
          {recipient?.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Details List */}
      <div className="p-4 space-y-4 flex-1">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Bio
          </label>
          <p className="text-sm bg-accent/30 p-3 rounded-xl border border-border/40">{bio}</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Settings & Appearance
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center justify-between p-3 bg-accent/40 hover:bg-accent rounded-xl text-sm transition"
            >
              <span className="flex items-center gap-2.5">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                Theme Mode
              </span>
              <span className="text-xs text-muted-foreground font-medium capitalize">{theme || 'dark'}</span>
            </button>

            <button className="w-full flex items-center justify-between p-3 bg-accent/40 hover:bg-accent rounded-xl text-sm transition">
              <span className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-purple-400" />
                Notifications
              </span>
              <span className="text-xs text-emerald-400 font-medium">Enabled</span>
            </button>
          </div>
        </div>

        {/* Shared Assets */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Shared Media
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center p-3 bg-accent/40 rounded-xl text-xs hover:bg-accent cursor-pointer">
              <Image className="w-4 h-4 text-primary mb-1" />
              <span>Media</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-accent/40 rounded-xl text-xs hover:bg-accent cursor-pointer">
              <FileText className="w-4 h-4 text-amber-400 mb-1" />
              <span>Files</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-accent/40 rounded-xl text-xs hover:bg-accent cursor-pointer">
              <Link2 className="w-4 h-4 text-emerald-400 mb-1" />
              <span>Links</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
