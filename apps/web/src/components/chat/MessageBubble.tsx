import React, { useState } from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { MessageDto } from '@nexchat/shared';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageContextMenu } from './MessageContextMenu';

interface MessageBubbleProps {
  message: MessageDto;
  onReply: (msg: MessageDto) => void;
  onEdit: (msg: MessageDto) => void;
  onDelete: (msgId: string) => void;
  onReact: (msgId: string, emoji: string) => void;
  onForward: (msg: MessageDto) => void;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (msgId: string) => void;
}

const EMOJI_LIST = ['❤️', '👍', '🔥', '🎉', '😂', '👏'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onForward,
  isMultiSelectMode,
  isSelected,
  onToggleSelect,
}) => {
  const { user } = useAuthStore();
  const isOutgoing = message.senderId === user?.id;

  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  // Group reactions by emoji
  const reactionCounts: Record<string, number> = {};
  message.reactions?.forEach((r) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });

  return (
    <>
      <div
        className={`flex items-center gap-2 my-1 group ${
          isOutgoing ? 'flex-row-reverse' : 'flex-row'
        }`}
        onContextMenu={handleContextMenu}
      >
        {isMultiSelectMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect && onToggleSelect(message.id)}
            className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
          />
        )}

        <div className={`flex flex-col max-w-[80%] sm:max-w-[65%] ${isOutgoing ? 'items-end' : 'items-start'}`}>
          <div
            className={`relative px-3.5 py-2 rounded-2xl shadow-sm transition-all duration-150 ${
              isOutgoing
                ? 'bg-[#1e6a99] dark:bg-[#1b6492] text-white rounded-tr-xs'
                : 'bg-card border border-border/50 text-foreground rounded-tl-xs'
            }`}
          >
            {/* Sender Handle */}
            {!isOutgoing && message.sender && (
              <span className="block text-[11px] font-bold text-sky-400 mb-0.5">
                @{message.sender.username}
              </span>
            )}

            {/* Reply Banner */}
            {message.replyTo && (
              <div
                className={`pl-2.5 py-1 my-1 border-l-2 text-xs rounded bg-black/10 dark:bg-white/5 ${
                  isOutgoing ? 'border-sky-300' : 'border-sky-500'
                }`}
              >
                <span className="font-semibold block text-[10px] opacity-80">
                  @{message.replyTo.sender?.username || 'User'}
                </span>
                <p className="truncate opacity-90">{message.replyTo.content || 'Attachment'}</p>
              </div>
            )}

            {/* Content */}
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>

            {/* Footer Metadata */}
            <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-75 float-right ml-3">
              {message.isEdited && <span>edited</span>}
              <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
              {isOutgoing && (
                <span>
                  {message.status === 'READ' ? (
                    <CheckCheck className="w-3.5 h-3.5 inline text-sky-200" />
                  ) : (
                    <Check className="w-3.5 h-3.5 inline opacity-80" />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Quick Reaction Pills underneath */}
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className="px-2 py-0.5 bg-card/80 border border-border/60 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-2xs hover:bg-accent transition"
              >
                <span>{emoji}</span>
                <span className="text-[10px] text-muted-foreground">{count}</span>
              </button>
            ))}

            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 px-1 bg-card/60 backdrop-blur-md rounded-full border border-border/40">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className="hover:scale-125 transition-transform p-0.5 text-xs"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {menuPos && (
        <MessageContextMenu
          x={menuPos.x}
          y={menuPos.y}
          message={message}
          onClose={() => setMenuPos(null)}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
};
