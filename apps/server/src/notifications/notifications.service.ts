import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as webPush from 'web-push';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidPublicKey: string = '';
  private vapidPrivateKey: string = '';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.vapidPublicKey =
      this.configService.get<string>('VAPID_PUBLIC_KEY') ||
      'BEl62iUYgUivxIkv69yViEuiBIa1F10N-M5E19y4N83L6N3t24M6w-JzZfS0GgB9uE7L4f0Q-2E_6Q1N_0A1B2C';
    this.vapidPrivateKey =
      this.configService.get<string>('VAPID_PRIVATE_KEY') ||
      'u1V9f_W0a3L2k1N0B2C3D4E5F6G7H8I9J0K1L2M3N4O';
    const vapidSubject =
      this.configService.get<string>('VAPID_SUBJECT') || 'mailto:support@nexchat.io';

    try {
      webPush.setVapidDetails(vapidSubject, this.vapidPublicKey, this.vapidPrivateKey);
    } catch (err: any) {
      this.logger.warn(`WebPush VAPID setup notice: ${err.message || err}`);
    }
  }

  getVapidPublicKey() {
    return { publicKey: this.vapidPublicKey };
  }

  async saveSubscription(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
  ) {
    const existing = await this.prisma.pushSubscription.findFirst({
      where: { userId, endpoint },
    });

    if (existing) {
      return this.prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { p256dh, auth },
      });
    }

    return this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint,
        p256dh,
        auth,
      },
    });
  }

  async removeSubscription(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { success: true };
  }

  async sendPushNotification(
    userId: string,
    payload: { title: string; body: string; icon?: string; url?: string; data?: any },
  ) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return;
    }

    const pushPayload = JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon.png',
        data: {
          url: payload.url || '/',
          ...payload.data,
        },
      },
    });

    for (const sub of subscriptions) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webPush.sendNotification(pushSub, pushPayload);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired or invalid
          await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          this.logger.error(`Error sending push notification to user ${userId}:`, error);
        }
      }
    }
  }
}
