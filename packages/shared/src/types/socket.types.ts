export enum SocketEvents {
  // Client -> Server
  MESSAGE_SEND = 'message:send',
  MESSAGE_TYPING = 'message:typing',
  MESSAGE_READ = 'message:read',
  MESSAGE_EDIT = 'message:edit',
  MESSAGE_DELETE = 'message:delete',
  MESSAGE_REACT = 'message:react',
  PRESENCE_HEARTBEAT = 'presence:heartbeat',

  // Call signaling (Client <-> Server)
  CALL_INVITE = 'call:invite',
  CALL_ACCEPT = 'call:accept',
  CALL_REJECT = 'call:reject',
  CALL_END = 'call:end',
  CALL_SIGNAL = 'call:signal',

  // Server -> Client
  MESSAGE_NEW = 'message:new',
  MESSAGE_ACK = 'message:ack',
  MESSAGE_STATUS_UPDATE = 'message:status_update',
  USER_TYPING = 'user:typing',
  USER_PRESENCE = 'user:presence',
  MESSAGE_EDITED = 'message:edited',
  MESSAGE_DELETED = 'message:deleted',
  MESSAGE_REACTION_UPDATE = 'message:reaction_update',

  // Call Server -> Client
  CALL_INCOMING = 'call:incoming',
  CALL_ACCEPTED = 'call:accepted',
  CALL_REJECTED = 'call:rejected',
  CALL_BUSY = 'call:busy',
  CALL_ENDED = 'call:ended',
}

export interface SendMessagePayload {
  chatId: string;
  tempId: string;
  content: string;
  type?: string;
  replyToId?: string;
}

export interface TypingPayload {
  chatId: string;
  isTyping: boolean;
}

export interface ReadMessagesPayload {
  chatId: string;
  messageIds: string[];
}
