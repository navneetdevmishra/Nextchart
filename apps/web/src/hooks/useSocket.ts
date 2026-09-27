import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const {
    addMessage,
    updateMessageAck,
    updateMessageEdit,
    deleteMessageLocally,
    setUserTyping,
    updateUserPresenceInChats,
  } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Connected to NexChat Socket Server');
    });

    socket.on('message:new', (message: any) => {
      addMessage(message.chatId, message);
    });

    socket.on('message:ack', (ack: any) => {
      updateMessageAck(ack.chatId, ack.tempId, ack.messageId, ack.createdAt);
    });

    socket.on('user:typing', (data: { chatId: string; username: string; isTyping: boolean }) => {
      setUserTyping(data.chatId, data.username, data.isTyping);
    });

    socket.on('user:presence', (data: { userId: string; isOnline: boolean; lastSeen: string }) => {
      updateUserPresenceInChats(data.userId, data.isOnline, data.lastSeen);
    });

    socket.on('message:edited', (updated: any) => {
      updateMessageEdit(updated.chatId, updated.id, updated.content);
    });

    socket.on('message:deleted', (data: { chatId: string; messageId: string }) => {
      deleteMessageLocally(data.chatId, data.messageId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    isAuthenticated,
    accessToken,
    addMessage,
    updateMessageAck,
    updateMessageEdit,
    deleteMessageLocally,
    setUserTyping,
    updateUserPresenceInChats,
  ]);

  const emitSendMessage = (payload: {
    chatId: string;
    tempId: string;
    content: string;
    type?: string;
    replyToId?: string;
  }) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('message:send', payload);
    }
  };

  const emitTyping = (chatId: string, isTyping: boolean) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('message:typing', { chatId, isTyping });
    }
  };

  const emitEditMessage = (messageId: string, content: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('message:edit', { messageId, content });
    }
  };

  const emitDeleteMessage = (messageId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('message:delete', { messageId });
    }
  };

  const emitReadMessages = (chatId: string, messageIds: string[]) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('message:read', { chatId, messageIds });
    }
  };

  const emitReactMessage = (messageId: string, chatId: string, emoji: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('message:react', { messageId, chatId, emoji });
    }
  };

  return {
    socket: socketRef.current,
    emitSendMessage,
    emitTyping,
    emitEditMessage,
    emitDeleteMessage,
    emitReadMessages,
    emitReactMessage,
  };
}
