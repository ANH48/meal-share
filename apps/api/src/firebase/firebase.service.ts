import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, initializeApp, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getDatabase } from 'firebase-admin/database';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: App | null = null;
  private readonly logger = new Logger(FirebaseService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    const value = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!value) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
      return;
    }
    try {
      let serviceAccount: object;

      // Accept either a file path or inline JSON string
      const trimmed = value.trim();
      if (trimmed.endsWith('.json') || (trimmed.startsWith('/') || trimmed.startsWith('.'))) {
        const filePath = path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
        serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        serviceAccount = JSON.parse(trimmed);
      }

      const databaseURL = this.config.get<string>('FIREBASE_DATABASE_URL');
      if (!getApps().length) {
        this.app = initializeApp({ credential: cert(serviceAccount as any), databaseURL });
      } else {
        this.app = getApps()[0];
      }
      this.logger.log('Firebase initialized successfully');
    } catch (err) {
      this.logger.error('Failed to initialize Firebase — check FIREBASE_SERVICE_ACCOUNT_JSON', err);
    }
  }

  get isEnabled() {
    return !!this.app;
  }

  async sendToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.app) return;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
    if (!user?.fcmToken) return;
    try {
      // Data-only message so onMessage foreground handler fires; SW shows notification from data
      await getMessaging(this.app).send({
        token: user.fcmToken,
        data: { title, body, ...(data ?? {}) },
      });
    } catch (err: any) {
      if (err?.code === 'messaging/registration-token-not-registered') {
        await this.prisma.user.update({ where: { id: userId }, data: { fcmToken: null } });
      }
    }
  }

  async writeMessage(groupId: string, message: {
    id: string;
    groupId: string;
    senderId: string | null;
    content: string;
    type: string;
    createdAt: Date;
    editedAt: Date | null;
    deletedAt: Date | null;
    sender: { id: string; name: string; avatarUrl: string | null } | null;
  }) {
    if (!this.app) return;
    const databaseURL = this.config.get<string>('FIREBASE_DATABASE_URL');
    if (!databaseURL) return;
    try {
      const db = getDatabase(this.app);
      await db.ref(`groups/${groupId}/messages/${message.id}`).set({
        id: message.id,
        groupId: message.groupId,
        senderId: message.senderId ?? null,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt.toISOString(),
        editedAt: message.editedAt?.toISOString() ?? null,
        deletedAt: message.deletedAt?.toISOString() ?? null,
        sender: message.sender ?? null,
        at: message.createdAt.getTime(),
      });
    } catch (err) {
      this.logger.error('RTDB writeMessage error', err);
    }
  }

  async writeNotification(userId: string, notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    createdAt: Date;
  }) {
    if (!this.app) return;
    const databaseURL = this.config.get<string>('FIREBASE_DATABASE_URL');
    if (!databaseURL) return;
    try {
      const db = getDatabase(this.app);
      await db.ref(`notification/${userId}/${notification.id}`).set({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data ?? {},
        createdAt: notification.createdAt.toISOString(),
        readAt: null,
        at: notification.createdAt.getTime(),
      });
    } catch (err) {
      this.logger.error('RTDB writeNotification error', err);
    }
  }

  async sendToMultiple(tokens: string[], title: string, body: string, data?: Record<string, string>) {
    if (!this.app || !tokens.length) return;
    try {
      // Data-only message so onMessage foreground handler fires; SW shows notification from data
      const response = await getMessaging(this.app).sendEachForMulticast({
        tokens,
        data: { title, body, ...(data ?? {}) },
      });
      const invalidTokens = tokens.filter((_, i) => {
        const r = response.responses[i];
        return !r.success && r.error?.code === 'messaging/registration-token-not-registered';
      });
      if (invalidTokens.length) {
        await this.prisma.user.updateMany({
          where: { fcmToken: { in: invalidTokens } },
          data: { fcmToken: null },
        });
      }
    } catch (err) {
      this.logger.error('FCM sendEachForMulticast error', err);
    }
  }
}
