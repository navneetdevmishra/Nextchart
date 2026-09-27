import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  async createChannel(
    ownerId: string,
    data: {
      name: string;
      handle: string;
      description?: string;
      avatarUrl?: string;
      isPrivate?: boolean;
    },
  ) {
    const cleanHandle = data.handle.toLowerCase().replace('@', '');

    const existing = await this.prisma.channel.findUnique({
      where: { handle: cleanHandle },
    });

    if (existing) {
      throw new ConflictException(`Channel handle @${cleanHandle} is already taken`);
    }

    const inviteCode = Math.random().toString(36).substring(2, 10);

    const newChat = await this.prisma.chat.create({
      data: {
        type: 'CHANNEL',
        name: data.name,
        description: data.description,
        avatarUrl: data.avatarUrl,
        isPrivate: data.isPrivate !== undefined ? data.isPrivate : false,
        inviteCode,
        channel: {
          create: {
            createdById: ownerId,
            handle: cleanHandle,
            subscriberCount: 1,
          },
        },
        members: {
          create: [{ userId: ownerId, role: 'OWNER' }],
        },
      },
      include: {
        channel: true,
        members: true,
      },
    });

    return newChat;
  }

  async searchChannels(query: string) {
    if (!query || query.trim().length === 0) return [];
    const clean = query.trim().toLowerCase().replace('@', '');

    const channels = await this.prisma.channel.findMany({
      where: {
        OR: [
          { handle: { contains: clean } },
          { chat: { name: { contains: clean } } },
        ],
      },
      include: {
        chat: {
          select: {
            id: true,
            name: true,
            description: true,
            avatarUrl: true,
            type: true,
            createdAt: true,
          },
        },
      },
      take: 20,
    });

    return channels;
  }

  async subscribe(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { channel: true },
    });

    if (!chat || chat.type !== 'CHANNEL' || !chat.channel) {
      throw new NotFoundException('Broadcast channel not found');
    }

    const member = await this.prisma.chatMember.upsert({
      where: { chatId_userId: { chatId, userId } },
      create: { chatId, userId, role: 'MEMBER' },
      update: {},
    });

    // Increment subscriber count
    await this.prisma.channel.update({
      where: { id: chat.channel.id },
      data: { subscriberCount: { increment: 1 } },
    });

    return { success: true, member };
  }

  async unsubscribe(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { channel: true },
    });

    if (!chat || chat.type !== 'CHANNEL' || !chat.channel) {
      throw new NotFoundException('Broadcast channel not found');
    }

    await this.prisma.chatMember
      .delete({
        where: { chatId_userId: { chatId, userId } },
      })
      .catch(() => null);

    await this.prisma.channel.update({
      where: { id: chat.channel.id },
      data: { subscriberCount: { decrement: 1 } },
    });

    return { success: true };
  }

  async publishPost(
    userId: string,
    chatId: string,
    postData: { content: string; type?: string; attachments?: any[] },
  ) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    // Admin-only authorization check!
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Only channel administrators can publish posts');
    }

    const post = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content: postData.content,
        type: (postData.type as any) || 'TEXT',
        attachments: postData.attachments?.length
          ? {
              create: postData.attachments.map((a) => ({
                fileUrl: a.fileUrl,
                fileType: a.fileType,
                fileName: a.fileName,
                fileSize: a.fileSize || 0,
                duration: a.duration || null,
              })),
            }
          : undefined,
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        attachments: true,
      },
    });

    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return post;
  }
}
