export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

export interface UserProfile {
  id: string;
  userId: string;
  customStatus?: string | null;
  themePreference: string;
  soundEnabled: boolean;
  showLastSeen: boolean;
  showReadReceipts: boolean;
}

export interface UserDto {
  id: string;
  email: string;
  username: string;
  phoneNumber?: string | null;
  role: Role;
  avatarUrl?: string | null;
  bio?: string | null;
  lastSeen: string;
  isOnline: boolean;
  createdAt: string;
  profile?: UserProfile | null;
}

export interface AuthResponseDto {
  success: boolean;
  user: UserDto;
  accessToken: string;
}
