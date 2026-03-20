import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseService,
  ) {}

  async notifyUser(userId: string, title: string, body: string, type: string, data?: Record<string, string>) {
    const notification = await this.prisma.notification.create({ data: { userId, title, body, type, data: data ?? {} } });
    await Promise.all([
      this.firebase.sendToUser(userId, title, body, data),
      this.firebase.writeNotification(userId, { id: notification.id, type, title, body, data, createdAt: notification.createdAt }),
    ]);
  }

  async notifyGroup(groupId: string, title: string, body: string, type: string, data?: Record<string, string>, excludeUserId?: string) {
    const members = await this.prisma.groupMember.findMany({
      where: { groupId, status: 'active', ...(excludeUserId ? { NOT: { userId: excludeUserId } } : {}) },
      select: { userId: true, user: { select: { fcmToken: true } } },
    });

    const created = await Promise.all(
      members.map((m) => this.prisma.notification.create({ data: { userId: m.userId, title, body, type, data: data ?? {} } })),
    );

    const tokens = members.map((m) => m.user.fcmToken).filter((t): t is string => !!t);
    await Promise.all([
      this.firebase.sendToMultiple(tokens, title, body, data),
      ...created.map((n) => this.firebase.writeNotification(n.userId, { id: n.id, type, title, body, data, createdAt: n.createdAt })),
    ]);
  }

  async findByUser(userId: string, cursor?: string, limit = 10) {
    const rows = await this.prisma.notification.findMany({
      where: { userId, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const notifications = hasMore ? rows.slice(0, limit) : rows;
    return {
      notifications,
      nextCursor: hasMore ? notifications[notifications.length - 1].createdAt.toISOString() : null,
    };
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
