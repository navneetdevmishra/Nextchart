import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';
import { TotpUtil } from './totp.util';

@Injectable()
export class PrivacyService {
  constructor(private prisma: PrismaService) {}

  // Block user
  async blockUser(userId: string, blockedId: string) {
    if (userId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const existing = await this.prisma.blockedUser.findUnique({
      where: {
        userId_blockedId: {
          userId,
          blockedId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.blockedUser.create({
      data: {
        userId,
        blockedId,
      },
      include: {
        blocked: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });
  }

  // Unblock user
  async unblockUser(userId: string, blockedId: string) {
    await this.prisma.blockedUser.deleteMany({
      where: {
        userId,
        blockedId,
      },
    });
    return { success: true };
  }

  // Get blocked users
  async getBlockedUsers(userId: string) {
    return this.prisma.blockedUser.findMany({
      where: { userId },
      include: {
        blocked: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });
  }

  // Check if blocked
  async isUserBlocked(userId: string, targetUserId: string): Promise<boolean> {
    const record = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { userId, blockedId: targetUserId },
          { userId: targetUserId, blockedId: userId },
        ],
      },
    });
    return !!record;
  }

  // Privacy Settings
  async updatePrivacySettings(userId: string, settings: { showLastSeen?: boolean; showReadReceipts?: boolean }) {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        themePreference: 'dark',
        soundEnabled: true,
        showLastSeen: settings.showLastSeen ?? true,
        showReadReceipts: settings.showReadReceipts ?? true,
      },
    });
    return profile;
  }

  // Active Sessions
  async getActiveSessions(userId: string, currentRefreshToken?: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceInfo: session.userAgent || 'Unknown Device',
      ipAddress: session.ipAddress,
      createdAt: session.createdAt.toISOString(),
      lastActive: session.createdAt.toISOString(),
      isCurrent: session.refreshToken === currentRefreshToken,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.delete({ where: { id: sessionId } });
    return { success: true };
  }

  async revokeOtherSessions(userId: string, currentRefreshToken?: string) {
    if (!currentRefreshToken) {
      throw new BadRequestException('Current session missing');
    }

    await this.prisma.session.deleteMany({
      where: {
        userId,
        refreshToken: { not: currentRefreshToken },
      },
    });
    return { success: true };
  }

  // Two-Factor Authentication (2FA)
  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = TotpUtil.generateSecret();
    const otpauthUrl = TotpUtil.getOtpauthUrl(user.username, 'NexChat', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Save temporary secret to user
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { secret, otpauthUrl, qrCodeUrl };
  }

  async verifyAndEnable2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initialized');
    }

    const isValid = TotpUtil.verify(user.twoFactorSecret, token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    return { success: true, message: '2FA enabled successfully' };
  }

  async disable2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const isValid = TotpUtil.verify(user.twoFactorSecret, token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: false, twoFactorSecret: null },
    });

    return { success: true, message: '2FA disabled successfully' };
  }
}
