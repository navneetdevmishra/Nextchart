import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(
    ownerId: string,
    data: {
      name: string;
      description?: string;
      avatarUrl?: string;
      isPrivate?: boolean;
      memberUsernames?: string[];
    },
  ) {
    const inviteCode = Math.random().toString(36).substring(2, 10);

    // Find initial members by handles
    const foundMembers = data.memberUsernames?.length
      ? await this.prisma.user.findMany({
          where: { username: { in: data.memberUsernames.map((u) => u.toLowerCase()) } },
        })
      : [];

    const memberCreates = [
      { userId: ownerId, role: 'OWNER' as const },
      ...foundMembers
        .filter((u) => u.id !== ownerId)
        .map((u) => ({ userId: u.id, role: 'MEMBER' as const })),
    ];

    const newChat = await this.prisma.chat.create({
      data: {
        type: 'GROUP',
        name: data.name,
        description: data.description,
        avatarUrl: data.avatarUrl,
        isPrivate: data.isPrivate !== undefined ? data.isPrivate : true,
        inviteCode,
        group: {
          create: {
            createdById: ownerId,
          },
        },
        members: {
          create: memberCreates,
        },
      },
      include: {
        group: true,
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true, isOnline: true } },
          },
        },
      },
    });

    return newChat;
  }

  async getGroupInfo(chatId: string, userId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Access denied to group information');
    }

    const groupChat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        group: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                bio: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
      },
    });

    if (!groupChat || groupChat.type !== 'GROUP') {
      throw new NotFoundException('Group chat not found');
    }

    return groupChat;
  }

  async addMember(chatId: string, adminUserId: string, targetUsername: string) {
    const adminMember = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId: adminUserId } },
    });

    if (!adminMember || (adminMember.role !== 'OWNER' && adminMember.role !== 'ADMIN')) {
      throw new ForbiddenException('Only group admins or owners can add members');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername.toLowerCase() },
    });

    if (!targetUser) {
      throw new NotFoundException(`User @${targetUsername} not found`);
    }

    const updated = await this.prisma.chatMember.upsert({
      where: { chatId_userId: { chatId, userId: targetUser.id } },
      create: { chatId, userId: targetUser.id, role: 'MEMBER' },
      update: {},
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, isOnline: true } },
      },
    });

    return updated;
  }

  async removeMember(chatId: string, adminUserId: string, targetUserId: string) {
    const adminMember = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId: adminUserId } },
    });

    if (!adminMember || (adminMember.role !== 'OWNER' && adminMember.role !== 'ADMIN')) {
      throw new ForbiddenException('Only group admins or owners can remove members');
    }

    await this.prisma.chatMember.delete({
      where: { chatId_userId: { chatId, userId: targetUserId } },
    });

    return { success: true, removedUserId: targetUserId };
  }

  async joinByInviteCode(userId: string, inviteCode: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { inviteCode },
    });

    if (!chat || chat.type !== 'GROUP') {
      throw new NotFoundException('Invalid or expired group invite link');
    }

    const newMember = await this.prisma.chatMember.upsert({
      where: { chatId_userId: { chatId: chat.id, userId } },
      create: { chatId: chat.id, userId, role: 'MEMBER' },
      update: {},
    });

    return { success: true, chatId: chat.id, member: newMember };
  }
}
