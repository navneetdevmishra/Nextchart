import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from '../auth/dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cleanQuery = query.trim().toLowerCase().replace('@', '');

    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { username: { contains: cleanQuery } },
          { email: { contains: cleanQuery } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
      },
      take: 20,
    });

    return users;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username ? dto.username.toLowerCase() : undefined,
        bio: dto.bio !== undefined ? dto.bio : undefined,
        avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl : undefined,
        profile: {
          upsert: {
            create: {
              customStatus: dto.customStatus,
              themePreference: dto.themePreference || 'dark',
            },
            update: {
              customStatus: dto.customStatus,
              themePreference: dto.themePreference,
            },
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const { passwordHash, ...result } = updatedUser;
    return { success: true, user: result };
  }
}
