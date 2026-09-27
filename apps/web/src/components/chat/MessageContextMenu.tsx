import React, { useEffect, useRef } from 'react';
import { Reply, Edit3, Copy, Forward, Pin, Trash2 } from 'lucide-react';
import { MessageDto } from '@nexchat/shared';
import { useAuthStore } from '@/store/useAuthStore';

interface MessageContextMenuProps {
  x: number;
  y: number;
  message: MessageDto;
  onClose: () => void;
  onReply: (msg: MessageDto) => void;
  onEdit: (msg: MessageDto) => void;
  onDelete: (msgId: string) => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  x,
  y,
  message,
  onClose,
  onReply,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = message.senderId === user?.id;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${y}px`, left: `${x}px` }}
      className="fixed z-50 min-w-[180px] bg-popover border border-border text-popover-foreground rounded-xl shadow-2xl py-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
    >
      <button
        onClick={() => { onReply(message); onClose(); }}
        className="w-full flex items-center gap-3 px-3.5 py-2 text-xs hover:bg-accent hover:text-accent-foreground text-left transition"
      >
        <Reply className="w-4 h-4 text-sky-400" />
        Reply
      </button>

      {isOwner && (
        <button
          onClick={() => { onEdit(message); onClose(); }}
          className="w-full flex items-center gap-3 px-3.5 py-2 text-xs hover:bg-accent hover:text-accent-foreground text-left transition"
        >
          <Edit3 className="w-4 h-4 text-amber-400" />
          Edit Message
        </button>
      )}

      <button
        onClick={handleCopy}
        className="w-full flex items-center gap-3 px-3.5 py-2 text-xs hover:bg-accent hover:text-accent-foreground text-left transition"
      >
        <Copy className="w-4 h-4 text-emerald-400" />
        Copy Text
      </button>

      <button
        onClick={() => onClose()}
        className="w-full flex items-center gap-3 px-3.5 py-2 text-xs hover:bg-accent hover:text-accent-foreground text-left transition"
      >
        <Forward className="w-4 h-4 text-purple-400" />
        Forward
      </button>

      <button
        onClick={() => onClose()}
        className="w-full flex items-center gap-3 px-3.5 py-2 text-xs hover:bg-accent hover:text-accent-foreground text-left transition"
      >
        <Pin className="w-4 h-4 text-indigo-400" />
        Pin Message
      </button>

      {isOwner && (
        <div className="pt-1 mt-1 border-t border-border">
          <button
            onClick={() => { onDelete(message.id); onClose(); }}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-destructive hover:bg-destructive/10 text-left transition font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete Message
          </button>
        </div>
      )}
    </div>
  );
};
