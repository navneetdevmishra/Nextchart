import { UserDto } from './user.types';

export enum ChatType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  CHANNEL = 'CHANNEL',
}

export enum GroupMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export interface ChatMemberDto {
  id: string;
  chatId: string;
  userId: string;
  role: GroupMemberRole;
  joinedAt: string;
  mutedUntil?: string | null;
  user: UserDto;
}

export interface ChatDto {
  id: string;
  type: ChatType;
  name?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  isPrivate: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  unreadCount?: number;
  updatedAt: string;
  createdAt: string;
  members: ChatMemberDto[];
  recipient?: UserDto | null;
  lastMessage?: any | null;
}
