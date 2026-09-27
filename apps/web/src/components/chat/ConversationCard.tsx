import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Pin, Check, CheckCheck } from 'lucide-react';
import { ChatDto } from '@nexchat/shared';
import { useAuthStore } from '@/store/useAuthStore';

interface ConversationCardProps {
  chat: ChatDto;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({ chat, isActive, onClick }) => {
  const { user } = useAuthStore();
  const recipient = chat.recipient;

  const displayName = chat.type === 'DIRECT'
    ? recipient?.username || 'User'
    : chat.name || 'Group Chat';

  const avatarUrl = chat.type === 'DIRECT' ? recipient?.avatarUrl : chat.avatarUrl;
  const isOnline = chat.type === 'DIRECT' && recipient?.isOnline;

  const lastMessage = chat.lastMessage;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  };

  const isOutgoing = lastMessage?.senderId === user?.id;

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'hover:bg-accent/60 text-foreground'
      }`}
    >
      {/* Avatar Container */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-accent flex items-center justify-center font-bold text-lg border border-border/40">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className={isActive ? 'text-primary-foreground' : 'text-primary'}>
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
        )}
      </div>

      {/* Info Container */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h4
            className={`font-semibold text-sm truncate ${
              isActive ? 'text-primary-foreground' : 'text-foreground'
            }`}
          >
            {chat.type === 'DIRECT' ? `@${displayName}` : displayName}
          </h4>
          <span
            className={`text-xs flex-shrink-0 ${
              isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
            }`}
          >
            {formatTime(lastMessage?.createdAt || chat.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs truncate flex-1 ${
              isActive ? 'text-primary-foreground/90' : 'text-muted-foreground'
            }`}
          >
            {isOutgoing && (
              <span className="inline-block mr-1">
                {lastMessage?.status === 'READ' ? (
                  <CheckCheck className="w-3.5 h-3.5 inline text-sky-300" />
                ) : (
                  <Check className="w-3.5 h-3.5 inline opacity-70" />
                )}
              </span>
            )}
            {lastMessage ? lastMessage.content || 'Attachment' : 'No messages yet'}
          </p>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {chat.isPinned && (
              <Pin className={`w-3.5 h-3.5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            )}
            {chat.unreadCount && chat.unreadCount > 0 ? (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded-full">
                {chat.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
