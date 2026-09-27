import { create } from 'zustand';
import { ChatDto, MessageDto } from '@nexchat/shared';

interface ChatState {
  chats: ChatDto[];
  activeChatId: string | null;
  messages: Record<string, MessageDto[]>; // chatId -> messages array
  typingUsers: Record<string, string[]>; // chatId -> usernames array typing
  isInfoDrawerOpen: boolean;
  replyToMessage: MessageDto | null;
  editingMessage: MessageDto | null;

  setChats: (chats: ChatDto[]) => void;
  addChat: (chat: ChatDto) => void;
  setActiveChatId: (chatId: string | null) => void;
  setMessages: (chatId: string, messages: MessageDto[]) => void;
  addMessage: (chatId: string, message: MessageDto) => void;
  updateMessageAck: (chatId: string, tempId: string, realId: string, createdAt: string) => void;
  updateMessageEdit: (chatId: string, messageId: string, content: string) => void;
  deleteMessageLocally: (chatId: string, messageId: string) => void;
  setUserTyping: (chatId: string, username: string, isTyping: boolean) => void;
  toggleInfoDrawer: (open?: boolean) => void;
  setReplyToMessage: (msg: MessageDto | null) => void;
  setEditingMessage: (msg: MessageDto | null) => void;
  updateUserPresenceInChats: (userId: string, isOnline: boolean, lastSeen?: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChatId: null,
  messages: {},
  typingUsers: {},
  isInfoDrawerOpen: false,
  replyToMessage: null,
  editingMessage: null,

  setChats: (chats) => set({ chats }),

  addChat: (chat) =>
    set((state) => {
      const exists = state.chats.some((c) => c.id === chat.id);
      if (exists) return { chats: state.chats, activeChatId: chat.id };
      return { chats: [chat, ...state.chats], activeChatId: chat.id };
    }),

  setActiveChatId: (chatId) => set({ activeChatId: chatId, replyToMessage: null, editingMessage: null }),

  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    })),

  addMessage: (chatId, message) =>
    set((state) => {
      const currentList = state.messages[chatId] || [];
      // avoid duplicates
      if (currentList.some((m) => m.id === message.id)) return state;

      // Update chat list last message snippet
      const updatedChats = state.chats.map((c) => {
        if (c.id === chatId) {
          return { ...c, lastMessage: message, updatedAt: new Date().toISOString() };
        }
        return c;
      });

      return {
        messages: { ...state.messages, [chatId]: [...currentList, message] },
        chats: updatedChats,
      };
    }),

  updateMessageAck: (chatId, tempId, realId, createdAt) =>
    set((state) => {
      const currentList = state.messages[chatId] || [];
      const updatedList = currentList.map((m) => {
        if (m.tempId === tempId || m.id === tempId) {
          return { ...m, id: realId, createdAt, status: 'SENT' as any };
        }
        return m;
      });
      return { messages: { ...state.messages, [chatId]: updatedList } };
    }),

  updateMessageEdit: (chatId, messageId, content) =>
    set((state) => {
      const currentList = state.messages[chatId] || [];
      const updatedList = currentList.map((m) =>
        m.id === messageId ? { ...m, content, isEdited: true } : m,
      );
      return { messages: { ...state.messages, [chatId]: updatedList } };
    }),

  deleteMessageLocally: (chatId, messageId) =>
    set((state) => {
      const currentList = state.messages[chatId] || [];
      const updatedList = currentList.map((m) =>
        m.id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m,
      );
      return { messages: { ...state.messages, [chatId]: updatedList } };
    }),

  setUserTyping: (chatId, username, isTyping) =>
    set((state) => {
      const currentTyping = state.typingUsers[chatId] || [];
      let updated: string[];

      if (isTyping) {
        updated = Array.from(new Set([...currentTyping, username]));
      } else {
        updated = currentTyping.filter((u) => u !== username);
      }

      return { typingUsers: { ...state.typingUsers, [chatId]: updated } };
    }),

  toggleInfoDrawer: (open) =>
    set((state) => ({ isInfoDrawerOpen: open !== undefined ? open : !state.isInfoDrawerOpen })),

  setReplyToMessage: (msg) => set({ replyToMessage: msg }),
  setEditingMessage: (msg) => set({ editingMessage: msg }),

  updateUserPresenceInChats: (userId, isOnline, lastSeen) =>
    set((state) => ({
      chats: state.chats.map((chat) => {
        if (chat.recipient && chat.recipient.id === userId) {
          return {
            ...chat,
            recipient: {
              ...chat.recipient,
              isOnline,
              lastSeen: lastSeen || chat.recipient.lastSeen,
            },
          };
        }
        return chat;
      }),
    })),
}));
