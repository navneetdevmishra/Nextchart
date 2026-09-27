import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CallsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async initiateCall(callerId: string, recipientId: string, type: 'VOICE' | 'VIDEO' = 'VOICE') {
    if (callerId === recipientId) {
      throw new BadRequestException('Cannot call yourself');
    }

    // Check if recipient has blocked caller
    const isBlocked = await this.prisma.blockedUser.findFirst({
      where: {
        userId: recipientId,
        blockedId: callerId,
      },
    });

    if (isBlocked) {
      throw new BadRequestException('User is not available');
    }

    const call = await this.prisma.callSession.create({
      data: {
        callerId,
        recipientId,
        type,
        status: 'INITIATED',
      },
      include: {
        caller: {
          select: { id: true, username: true, avatarUrl: true },
        },
        recipient: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return call;
  }

  async updateCallStatus(callId: string, userId: string, status: string) {
    const call = await this.prisma.callSession.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call session not found');
    }

    if (call.callerId !== userId && call.recipientId !== userId) {
      throw new BadRequestException('Not authorized for this call session');
    }

    const updateData: any = { status };

    if (status === 'ACCEPTED' && !call.startedAt) {
      updateData.startedAt = new Date();
    }

    if (['ENDED', 'REJECTED', 'BUSY', 'MISSED', 'FAILED'].includes(status)) {
      updateData.endedAt = new Date();
      if (call.startedAt) {
        const durationSeconds = Math.round(
          (new Date().getTime() - new Date(call.startedAt).getTime()) / 1000,
        );
        updateData.duration = durationSeconds;
      } else {
        updateData.duration = 0;
      }
    }

    const updatedCall = await this.prisma.callSession.update({
      where: { id: callId },
      data: updateData,
      include: {
        caller: {
          select: { id: true, username: true, avatarUrl: true },
        },
        recipient: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return updatedCall;
  }

  async getCallHistory(userId: string) {
    return this.prisma.callSession.findMany({
      where: {
        OR: [{ callerId: userId }, { recipientId: userId }],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        caller: {
          select: { id: true, username: true, avatarUrl: true },
        },
        recipient: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });
  }

  getIceServers() {
    const stunServer = this.configService.get<string>('STUN_SERVER') || 'stun:stun.l.google.com:19302';
    const turnServer = this.configService.get<string>('TURN_SERVER');
    const turnUsername = this.configService.get<string>('TURN_USERNAME');
    const turnCredential = this.configService.get<string>('TURN_PASSWORD');

    const iceServers: any[] = [
      { urls: stunServer.startsWith('stun:') ? stunServer : `stun:${stunServer}` },
    ];

    if (turnServer && turnUsername && turnCredential) {
      iceServers.push({
        urls: turnServer.startsWith('turn:') ? turnServer : `turn:${turnServer}`,
        username: turnUsername,
        credential: turnCredential,
      });
    }

    return { iceServers };
  }
}
