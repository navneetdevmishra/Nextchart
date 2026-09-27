import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, string>(); // userId -> socketId
  private socketRateLimits = new Map<string, number[]>(); // socketId -> timestamps array

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const secret =
        this.configService.get<string>('JWT_ACCESS_SECRET') ||
        'nexchat_super_secret_access_key_2026';

      const payload = await this.jwtService.verifyAsync(token, { secret });
      const userId = payload.sub;

      client.data.userId = userId;
      this.activeUsers.set(userId, client.id);

      // Update DB online status
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastSeen: new Date() },
      });

      // Join all user's chat rooms
      const memberships = await this.prisma.chatMember.findMany({
        where: { userId },
        select: { chatId: true },
      });

      memberships.forEach((m) => {
        client.join(`chat:${m.chatId}`);
      });

      // Broadcast presence update
      this.server.emit('user:presence', {
        userId,
        isOnline: true,
        lastSeen: new Date().toISOString(),
      });
    } catch (err) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.activeUsers.delete(userId);
      this.socketRateLimits.delete(client.id);

      const lastSeen = new Date();
      await this.prisma.user
        .update({
          where: { id: userId },
          data: { isOnline: false, lastSeen },
        })
        .catch(() => null);

      this.server.emit('user:presence', {
        userId,
        isOnline: false,
        lastSeen: lastSeen.toISOString(),
      });
    }
  }

  private isRateLimited(socketId: string): boolean {
    const now = Date.now();
    const timestamps = this.socketRateLimits.get(socketId) || [];
    const windowStart = now - 5000;
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= 15) {
      return true; // Limit: Max 15 messages per 5 seconds
    }

    validTimestamps.push(now);
    this.socketRateLimits.set(socketId, validTimestamps);
    return false;
  }

  @SubscribeMessage('chat:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data.chatId) return;

    // Verify room membership before joining
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: data.chatId, userId } },
    });

    if (member) {
      client.join(`chat:${data.chatId}`);
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      chatId: string;
      tempId?: string;
      content: string;
      type?: string;
      replyToId?: string;
    },
  ) {
    const userId = client.data.userId;
    if (!userId || !data.chatId || (!data.content && !data.type)) return;

    if (this.isRateLimited(client.id)) {
      client.emit('error', { message: 'Rate limit exceeded. Please slow down.' });
      return;
    }

    // Authorization check
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId: data.chatId, userId } },
    });

    if (!member) return;

    // Save message in PostgreSQL
    const message = await this.prisma.message.create({
      data: {
        chatId: data.chatId,
        senderId: userId,
        content: data.content,
        type: (data.type as any) || 'TEXT',
        replyToId: data.replyToId || null,
      },
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true },
        },
        replyTo: {
          include: {
            sender: { select: { id: true, username: true } },
          },
        },
      },
    });

    // Update chat updatedAt
    await this.prisma.chat.update({
      where: { id: data.chatId },
      data: { updatedAt: new Date() },
    });

    // Send ACK back to sender
    client.emit('message:ack', {
      tempId: data.tempId,
      messageId: message.id,
      chatId: data.chatId,
      status: 'SENT',
      createdAt: message.createdAt.toISOString(),
    });

    // Broadcast new message to room
    this.server.to(`chat:${data.chatId}`).emit('message:new', message);
  }

  @SubscribeMessage('message:read')
  async handleReadMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; messageIds: string[] },
  ) {
    const userId = client.data.userId;
    if (!userId || !data.chatId || !data.messageIds?.length) return;

    await Promise.all(
      data.messageIds.map((msgId) =>
        this.prisma.readReceipt
          .upsert({
            where: { messageId_userId: { messageId: msgId, userId } },
            create: { messageId: msgId, userId },
            update: {},
          })
          .catch(() => null),
      ),
    );

    this.server.to(`chat:${data.chatId}`).emit('message:status_update', {
      chatId: data.chatId,
      messageIds: data.messageIds,
      status: 'READ',
      userId,
    });
  }

  @SubscribeMessage('message:react')
  async handleReactMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; chatId: string; emoji: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data.messageId || !data.emoji) return;

    const existing = await this.prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: data.messageId,
          userId,
          emoji: data.emoji,
        },
      },
    });

    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.reaction.create({
        data: {
          messageId: data.messageId,
          userId,
          emoji: data.emoji,
        },
      });
    }

    const reactions = await this.prisma.reaction.findMany({
      where: { messageId: data.messageId },
      include: { user: { select: { id: true, username: true } } },
    });

    this.server.to(`chat:${data.chatId}`).emit('message:reaction_update', {
      messageId: data.messageId,
      chatId: data.chatId,
      reactions,
    });
  }

  @SubscribeMessage('message:typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    if (!userId || !data.chatId) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    client.to(`chat:${data.chatId}`).emit('user:typing', {
      chatId: data.chatId,
      userId,
      username: user?.username || 'User',
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data.messageId || !data.content) return;

    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
    });

    if (!message || message.senderId !== userId) return;

    const updated = await this.prisma.message.update({
      where: { id: data.messageId },
      data: { content: data.content, isEdited: true },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    this.server.to(`chat:${message.chatId}`).emit('message:edited', updated);
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data.messageId) return;

    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
    });

    if (!message || message.senderId !== userId) return;

    await this.prisma.message.update({
      where: { id: data.messageId },
      data: { isDeleted: true, content: 'This message was deleted' },
    });

    this.server.to(`chat:${message.chatId}`).emit('message:deleted', {
      messageId: data.messageId,
      chatId: message.chatId,
    });
  }

  // --- WebRTC Call Signaling Handlers ---

  @SubscribeMessage('call:invite')
  async handleCallInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      callId: string;
      receiverId: string;
      type: 'VOICE' | 'VIDEO';
    },
  ) {
    const callerId = client.data.userId;
    if (!callerId || !data.receiverId || !data.callId) return;

    const caller = await this.prisma.user.findUnique({
      where: { id: callerId },
      select: { id: true, username: true, avatarUrl: true },
    });

    const receiverSocketId = this.activeUsers.get(data.receiverId);

    if (!receiverSocketId) {
      client.emit('call:busy', { callId: data.callId, reason: 'User offline' });
      return;
    }

    this.server.to(receiverSocketId).emit('call:incoming', {
      callId: data.callId,
      callerId,
      callerUsername: caller?.username || 'Unknown',
      callerAvatarUrl: caller?.avatarUrl,
      type: data.type,
    });
  }

  @SubscribeMessage('call:accept')
  async handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; callerId: string },
  ) {
    const receiverId = client.data.userId;
    if (!receiverId || !data.callerId) return;

    const callerSocketId = this.activeUsers.get(data.callerId);
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call:accepted', {
        callId: data.callId,
        receiverId,
      });
    }
  }

  @SubscribeMessage('call:reject')
  async handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; callerId: string; reason?: string },
  ) {
    const receiverId = client.data.userId;
    if (!receiverId || !data.callerId) return;

    const callerSocketId = this.activeUsers.get(data.callerId);
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('call:rejected', {
        callId: data.callId,
        receiverId,
        reason: data.reason || 'Declined',
      });
    }
  }

  @SubscribeMessage('call:end')
  async handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { callId: string; targetUserId: string },
  ) {
    const senderId = client.data.userId;
    if (!senderId || !data.targetUserId) return;

    const targetSocketId = this.activeUsers.get(data.targetUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('call:ended', {
        callId: data.callId,
        byUserId: senderId,
      });
    }
  }

  @SubscribeMessage('call:signal')
  async handleCallSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      callId: string;
      targetUserId: string;
      sdp?: any;
      candidate?: any;
      type?: string;
    },
  ) {
    const senderId = client.data.userId;
    if (!senderId || !data.targetUserId) return;

    const targetSocketId = this.activeUsers.get(data.targetUserId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('call:signal', {
        callId: data.callId,
        senderId,
        sdp: data.sdp,
        candidate: data.candidate,
        type: data.type,
      });
    }
  }
}
