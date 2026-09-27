import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(userId: string, query: string, type: string = 'ALL', limit = 20) {
    if (!query || query.trim().length === 0) {
      return { users: [], chats: [], messages: [], media: [] };
    }

    const cleanQuery = query.trim();

    // 1. User Search
    let users: any[] = [];
    if (type === 'ALL' || type === 'USERS') {
      users = await this.prisma.user.findMany({
        where: {
          AND: [
            { isSuspended: false },
            {
              OR: [
                { username: { contains: cleanQuery } },
                { email: { contains: cleanQuery } },
              ],
            },
          ],
        },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
          isOnline: true,
        },
        take: limit,
      });
    }

    // 2. Public Group & Channel Search
    let chats: any[] = [];
    if (type === 'ALL' || type === 'CHATS') {
      chats = await this.prisma.chat.findMany({
        where: {
          isPrivate: false,
          OR: [
            { name: { contains: cleanQuery } },
            { description: { contains: cleanQuery } },
          ],
        },
        include: {
          channel: { select: { handle: true, subscriberCount: true } },
          _count: { select: { members: true } },
        },
        take: limit,
      });
    }

    // 3. Authorized User Message Search
    let messages: any[] = [];
    if (type === 'ALL' || type === 'MESSAGES') {
      // Find chat IDs the user belongs to
      const memberships = await this.prisma.chatMember.findMany({
        where: { userId },
        select: { chatId: true },
      });
      const chatIds = memberships.map((m) => m.chatId);

      if (chatIds.length > 0) {
        messages = await this.prisma.message.findMany({
          where: {
            chatId: { in: chatIds },
            isDeleted: false,
            content: { contains: cleanQuery },
          },
          include: {
            sender: { select: { id: true, username: true, avatarUrl: true } },
            chat: { select: { id: true, name: true, type: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
      }
    }

    // 4. Shared Media & Attachment Search
    let media: any[] = [];
    if (type === 'ALL' || type === 'MEDIA') {
      const memberships = await this.prisma.chatMember.findMany({
        where: { userId },
        select: { chatId: true },
      });
      const chatIds = memberships.map((m) => m.chatId);

      if (chatIds.length > 0) {
        media = await this.prisma.attachment.findMany({
          where: {
            message: { chatId: { in: chatIds } },
            fileName: { contains: cleanQuery },
          },
          include: {
            message: {
              include: {
                sender: { select: { id: true, username: true } },
              },
            },
          },
          take: limit,
        });
      }
    }

    return { users, chats, messages, media };
  }
}
