import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async getUserChats(userId: string) {
    const memberships = await this.prisma.chatMember.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                    avatarUrl: true,
                    isOnline: true,
                    lastSeen: true,
                  },
                },
              },
            },
            messages: {
              where: { isDeleted: false },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: { id: true, username: true, avatarUrl: true },
                },
                readReceipts: true,
              },
            },
          },
        },
      },
      orderBy: { chat: { updatedAt: 'desc' } },
    });

    const chatsWithUnread = await Promise.all(
      memberships.map(async (member) => {
        const chat = member.chat;
        const recipientMember = chat.members.find((m) => m.userId !== userId);

        // Count unread messages (messages sent by others that don't have a readReceipt from this user)
        const unreadCount = await this.prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: userId },
            isDeleted: false,
            readReceipts: {
              none: { userId },
            },
          },
        });

        const lastMsg = chat.messages.length > 0 ? chat.messages[0] : null;
        const isReadByRecipient = lastMsg
          ? lastMsg.readReceipts.some((r) => r.userId !== userId)
          : false;

        return {
          id: chat.id,
          type: chat.type,
          name: chat.name,
          description: chat.description,
          avatarUrl: chat.avatarUrl,
          isPrivate: chat.isPrivate,
          isPinned: member.isPinned,
          isMuted: member.isMuted,
          isArchived: member.isArchived,
          unreadCount,
          updatedAt: chat.updatedAt,
          createdAt: chat.createdAt,
          recipient: recipientMember ? recipientMember.user : null,
          lastMessage: lastMsg
            ? {
                ...lastMsg,
                status: isReadByRecipient ? 'READ' : 'SENT',
              }
            : null,
          members: chat.members,
        };
      }),
    );

    return chatsWithUnread;
  }

  async getOrCreateDirectChat(userId: string, recipientId: string) {
    if (userId === recipientId) {
      throw new ForbiddenException('Cannot create direct chat with yourself');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    // Check if chat exists
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true, avatarUrl: true, isOnline: true, lastSeen: true },
            },
          },
        },
      },
    });

    if (existingChat) {
      const recipientMember = existingChat.members.find((m) => m.userId !== userId);
      return {
        id: existingChat.id,
        type: existingChat.type,
        updatedAt: existingChat.updatedAt,
        recipient: recipientMember ? recipientMember.user : null,
        members: existingChat.members,
      };
    }

    // Create new DIRECT chat
    const newChat = await this.prisma.chat.create({
      data: {
        type: 'DIRECT',
        isPrivate: true,
        members: {
          create: [
            { userId, role: 'MEMBER' },
            { userId: recipientId, role: 'MEMBER' },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true, avatarUrl: true, isOnline: true, lastSeen: true },
            },
          },
        },
      },
    });

    const recipientMember = newChat.members.find((m) => m.userId !== userId);
    return {
      id: newChat.id,
      type: newChat.type,
      updatedAt: newChat.updatedAt,
      recipient: recipientMember ? recipientMember.user : null,
      members: newChat.members,
    };
  }

  async getChatMessages(chatId: string, userId: string, cursor?: string, limit = 50) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Access denied to conversation');
    }

    const messages = await this.prisma.message.findMany({
      where: { chatId, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      take: limit,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true },
        },
        replyTo: {
          include: {
            sender: { select: { id: true, username: true } },
          },
        },
        reactions: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
        readReceipts: true,
      },
    });

    return messages.map((m) => ({
      ...m,
      status: m.readReceipts.some((r) => r.userId !== m.senderId) ? 'READ' : 'SENT',
    }));
  }

  async updateMemberSettings(userId: string, chatId: string, settings: { isPinned?: boolean; isMuted?: boolean; isArchived?: boolean }) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!member) {
      throw new NotFoundException('Chat member record not found');
    }

    const updated = await this.prisma.chatMember.update({
      where: { id: member.id },
      data: settings,
    });

    return { success: true, member: updated };
  }

  async forwardMessages(userId: string, targetChatId: string, messageIds: string[]) {
    const targetMember = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: targetChatId, userId } },
    });

    if (!targetMember) {
      throw new ForbiddenException('Target chat access denied');
    }

    const sourceMessages = await this.prisma.message.findMany({
      where: { id: { in: messageIds } },
    });

    const forwarded = await Promise.all(
      sourceMessages.map((msg) =>
        this.prisma.message.create({
          data: {
            chatId: targetChatId,
            senderId: userId,
            content: `Forwarded: ${msg.content || ''}`,
            type: msg.type,
          },
          include: {
            sender: { select: { id: true, username: true, avatarUrl: true } },
          },
        }),
      ),
    );

    await this.prisma.chat.update({
      where: { id: targetChatId },
      data: { updatedAt: new Date() },
    });

    return forwarded;
  }
}
