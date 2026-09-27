export interface PrivacySettingsDto {
  showLastSeen?: boolean;
  showProfilePhoto?: boolean;
  showReadReceipts?: boolean;
}

export interface ActiveSessionDto {
  id: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface BlockUserDto {
  blockedUserId: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
}
