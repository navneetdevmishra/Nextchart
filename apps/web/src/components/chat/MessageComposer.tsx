import React, { useState } from 'react';
import { Paperclip, Smile, Mic, Send, X, Edit3, Reply } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';

interface MessageComposerProps {
  onSendMessage: (content: string, replyToId?: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onTyping: (isTyping: boolean) => void;
}

const COMMON_EMOJIS = ['😀', '😂', '😍', '🔥', '👍', '🎉', '❤️', '🙌', '🚀', '💯', '✨', '⚡'];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onEditMessage,
  onTyping,
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { replyToMessage, editingMessage, setReplyToMessage, setEditingMessage } = useChatStore();

  React.useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '');
    }
  }, [editingMessage]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping(e.target.value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) return;

    if (editingMessage) {
      onEditMessage(editingMessage.id, text.trim());
      setEditingMessage(null);
    } else {
      onSendMessage(text.trim(), replyToMessage?.id);
      setReplyToMessage(null);
    }

    setText('');
    setShowEmojiPicker(false);
    onTyping(false);
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    onTyping(true);
  };

  return (
    <div className="p-3 bg-card border-t border-border flex flex-col gap-2 relative">
      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 right-12 z-40 bg-popover border border-border p-3 rounded-2xl shadow-2xl grid grid-cols-6 gap-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="text-xl hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-accent"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Reply or Edit Banner */}
      {replyToMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-accent/60 rounded-xl text-xs border-l-4 border-sky-400">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-sky-400 block">
                Replying to @{replyToMessage.sender?.username}
              </span>
              <p className="truncate text-muted-foreground">{replyToMessage.content}</p>
            </div>
          </div>
          <button
            onClick={() => setReplyToMessage(null)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {editingMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-accent/60 rounded-xl text-xs border-l-4 border-amber-400">
          <div className="flex items-center gap-2 truncate">
            <Edit3 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-amber-400 block">Editing Message</span>
              <p className="truncate text-muted-foreground">{editingMessage.content}</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingMessage(null); setText(''); }}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex items-end gap-2">
        <button
          type="button"
          className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition flex-shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 bg-accent/40 border border-border rounded-2xl px-3 py-1.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-primary/40 transition">
          <textarea
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            className="w-full bg-transparent resize-none focus:outline-none text-sm max-h-32 min-h-[24px] py-1"
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`p-1 rounded-full transition flex-shrink-0 ${
              showEmojiPicker ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {text.trim().length > 0 ? (
          <button
            type="button"
            onClick={handleSubmit}
            className="p-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 shadow-md transition flex-shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            className="p-3 bg-accent/60 text-muted-foreground hover:text-foreground rounded-full transition flex-shrink-0"
            title="Voice note"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
