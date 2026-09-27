import { create } from 'zustand';
import { ChatDto, MessageDto } from '@nexchat/shared';

interface ChatState {
  chats: ChatDto[];
  activeChatId: string | null;
  messages: Record<string, MessageDto[]>;
  typingUsers: Record<string, string[]>;
  setChats: (chats: ChatDto[]) => void;
  setActiveChatId: (chatId: string | null) => void;
  setMessages: (chatId: string, messages: MessageDto[]) => void;
  addMessage: (chatId: string, message: MessageDto) => void;
  setUserTyping: (chatId: string, username: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChatId: null,
  messages: {},
  typingUsers: {},

  setChats: (chats) => set({ chats }),
  setActiveChatId: (chatId) => set({ activeChatId: chatId }),

  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    })),

  addMessage: (chatId, message) =>
    set((state) => {
      const existing = state.messages[chatId] || [];
      if (existing.some((m) => m.id === message.id)) return state;
      return {
        messages: { ...state.messages, [chatId]: [...existing, message] },
      };
    }),

  setUserTyping: (chatId, username, isTyping) =>
    set((state) => {
      const current = state.typingUsers[chatId] || [];
      const updated = isTyping
        ? Array.from(new Set([...current, username]))
        : current.filter((u) => u !== username);

      return {
        typingUsers: { ...state.typingUsers, [chatId]: updated },
      };
    }),
}));
