import React, { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Info, Search, Pin, ChevronDown, CheckSquare, Trash2, Forward, MessageSquare, Phone, Video } from 'lucide-react';
import { ChatDto, MessageDto } from '@nexchat/shared';
import { useChatStore } from '@/store/useChatStore';
import { useSocket } from '@/hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { ForwardMessageModal } from './ForwardMessageModal';

interface ChatAreaProps {
  chat: ChatDto;
  onStartCall?: (targetUserId: string, username: string, avatarUrl: string | null | undefined, type: 'VOICE' | 'VIDEO') => void;
}


export const ChatArea: React.FC<ChatAreaProps> = ({ chat, onStartCall }) => {
  const recipient = chat.recipient;
  const displayName = chat.type === 'DIRECT' ? recipient?.username || 'User' : chat.name || 'Group Chat';

  const {
    messages,
    typingUsers,
    toggleInfoDrawer,
    setReplyToMessage,
    setEditingMessage,
  } = useChatStore();

  const {
    emitSendMessage,
    emitTyping,
    emitEditMessage,
    emitDeleteMessage,
    emitReadMessages,
    emitReactMessage,
  } = useSocket();

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);

  const chatMessages = messages[chat.id] || [];
  const activeTypingList = typingUsers[chat.id] || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto read receipts trigger
  useEffect(() => {
    if (chatMessages.length > 0) {
      const unreadIds = chatMessages.filter((m) => m.status !== 'READ').map((m) => m.id);
      if (unreadIds.length > 0 && emitReadMessages) {
        emitReadMessages(chat.id, unreadIds);
      }
    }
  }, [chat.id, chatMessages.length, emitReadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, activeTypingList.length]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 200;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleSelectMessage = (msgId: string) => {
    setSelectedMsgIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId],
    );
  };

  const handleBatchDelete = () => {
    selectedMsgIds.forEach((id) => emitDeleteMessage(id));
    setSelectedMsgIds([]);
    setIsMultiSelectMode(false);
  };

  // Find pinned message in chat
  const pinnedMessage = chatMessages.find((m) => m.isPinned);

  // Group messages by Date
  const groupMessagesByDate = () => {
    const groups: { date: string; items: MessageDto[] }[] = [];
    chatMessages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      let dateKey = format(msgDate, 'MMMM d, yyyy');
      if (isToday(msgDate)) dateKey = 'Today';
      else if (isYesterday(msgDate)) dateKey = 'Yesterday';

      const existing = groups.find((g) => g.date === dateKey);
      if (existing) {
        existing.items.push(msg);
      } else {
        groups.push({ date: dateKey, items: [msg] });
      }
    });
    return groups;
  };

  const grouped = groupMessagesByDate();

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 relative overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-16 px-4 bg-card border-b border-border flex items-center justify-between flex-shrink-0 z-10 shadow-2xs">
        <div
          onClick={() => toggleInfoDrawer()}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
              {recipient?.avatarUrl ? (
                <img src={recipient.avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-full" />
              ) : (
                displayName?.charAt(0).toUpperCase()
              )}
            </div>
            {recipient?.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm">@{displayName}</h3>
            <p className="text-xs text-muted-foreground">
              {activeTypingList.length > 0 ? (
                <span className="text-sky-400 font-medium animate-pulse">typing...</span>
              ) : recipient?.isOnline ? (
                <span className="text-emerald-500 font-medium">online</span>
              ) : (
                'last seen recently'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          {chat.type === 'DIRECT' && recipient && onStartCall && (
            <>
              <button
                onClick={() => onStartCall(recipient.id, recipient.username, recipient.avatarUrl, 'VOICE')}
                className="p-2 hover:bg-accent hover:text-[#2AABEE] rounded-xl transition"
                title="Voice Call"
              >
                <Phone className="w-5 h-5 text-[#2AABEE]" />
              </button>
              <button
                onClick={() => onStartCall(recipient.id, recipient.username, recipient.avatarUrl, 'VIDEO')}
                className="p-2 hover:bg-accent hover:text-[#2AABEE] rounded-xl transition"
                title="Video Call"
              >
                <Video className="w-5 h-5 text-[#2AABEE]" />
              </button>
            </>
          )}

          <button
            onClick={() => setIsMultiSelectMode((prev) => !prev)}
            className={`p-2 rounded-xl transition ${
              isMultiSelectMode ? 'bg-primary/20 text-primary' : 'hover:bg-accent hover:text-foreground'
            }`}
            title="Multi-select mode"
          >
            <CheckSquare className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-accent hover:text-foreground rounded-xl transition">
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => toggleInfoDrawer()}
            className="p-2 hover:bg-accent hover:text-foreground rounded-xl transition"
            title="Chat info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div className="px-4 py-2 bg-accent/60 border-b border-border/50 flex items-center justify-between text-xs backdrop-blur-md">
          <div className="flex items-center gap-2.5 truncate">
            <Pin className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-sky-400 block">Pinned Message</span>
              <p className="truncate text-muted-foreground">{pinnedMessage.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-select Action Bar */}
      {isMultiSelectMode && selectedMsgIds.length > 0 && (
        <div className="px-4 py-2 bg-primary/10 border-b border-primary/30 flex items-center justify-between text-xs backdrop-blur-md">
          <span className="font-semibold text-primary">{selectedMsgIds.length} Selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setForwardModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 bg-sky-500 text-white rounded-lg font-medium hover:opacity-90"
            >
              <Forward className="w-3.5 h-3.5" /> Forward
            </button>
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1 px-3 py-1 bg-destructive text-white rounded-lg font-medium hover:opacity-90"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll View */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {grouped.length > 0 ? (
          grouped.map((group) => (
            <div key={group.date} className="space-y-2">
              {/* Sticky Date Separator */}
              <div className="flex justify-center my-3">
                <span className="px-3 py-1 bg-card/80 backdrop-blur-md border border-border/50 text-[11px] font-semibold text-muted-foreground rounded-full shadow-xs">
                  {group.date}
                </span>
              </div>

              {group.items.map((msg) => (
                <MessageBubble
                  key={msg.id || msg.tempId}
                  message={msg}
                  onReply={(m) => setReplyToMessage(m)}
                  onEdit={(m) => setEditingMessage(m)}
                  onDelete={(id) => emitDeleteMessage(id)}
                  onReact={(id, emoji) => emitReactMessage && emitReactMessage(id, chat.id, emoji)}
                  onForward={(m) => { setSelectedMsgIds([m.id]); setForwardModalOpen(true); }}
                  isMultiSelectMode={isMultiSelectMode}
                  isSelected={selectedMsgIds.includes(msg.id)}
                  onToggleSelect={toggleSelectMessage}
                />
              ))}
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
            <MessageSquare className="w-10 h-10 text-primary/40" />
            <p className="text-sm">No messages here yet. Send a message to start!</p>
          </div>
        )}

        {/* Live Typing Indicator */}
        {activeTypingList.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-sky-400 py-1 font-medium">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>{activeTypingList.join(', ')} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 z-30 p-3 bg-card border border-border text-foreground rounded-full shadow-2xl hover:bg-accent transition animate-in fade-in slide-in-from-bottom-2 duration-150"
          title="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5 text-primary" />
        </button>
      )}

      {/* Message Composer */}
      <MessageComposer
        onSendMessage={(content, replyToId) =>
          emitSendMessage({
            chatId: chat.id,
            tempId: `temp-${Date.now()}`,
            content,
            replyToId,
          })
        }
        onEditMessage={(msgId, content) => emitEditMessage(msgId, content)}
        onTyping={(isTyping) => emitTyping(chat.id, isTyping)}
      />

      <ForwardMessageModal
        isOpen={forwardModalOpen}
        messageIds={selectedMsgIds}
        onClose={() => { setForwardModalOpen(false); setSelectedMsgIds([]); setIsMultiSelectMode(false); }}
      />
    </div>
  );
};
