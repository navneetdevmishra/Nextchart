import { UserDto } from './user.types';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export interface AttachmentDto {
  id: string;
  messageId: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileSize: number;
}

export interface ReactionDto {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  user?: UserDto;
}

export interface MessageDto {
  id: string;
  tempId?: string;
  chatId: string;
  senderId: string;
  sender: UserDto;
  content?: string | null;
  type: MessageType;
  isEdited: boolean;
  isDeleted: boolean;
  isPinned?: boolean;
  replyToId?: string | null;
  replyTo?: MessageDto | null;
  status?: MessageStatus;
  createdAt: string;
  updatedAt: string;
  attachments?: AttachmentDto[];
  reactions?: ReactionDto[];
}
