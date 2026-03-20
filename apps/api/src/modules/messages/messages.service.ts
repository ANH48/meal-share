import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private firebase: FirebaseService,
  ) {}

  async create(dto: CreateMessageDto, userId: string) {
    await this.assertActiveMember(dto.groupId, userId);
    const msg = await this.prisma.groupMessage.create({
      data: { groupId: dto.groupId, senderId: userId, content: dto.content, type: 'user' },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });
    const senderName = msg.sender?.name ?? 'Someone';
    const preview = dto.content.length > 60 ? dto.content.slice(0, 60) + '...' : dto.content;
    // Write to RTDB for real-time chat sync (fire-and-forget)
    this.firebase.writeMessage(dto.groupId, msg).catch(() => {});

    // fire-and-forget so notification failure never blocks message delivery
    this.notificationsService
      .notifyGroup(
        dto.groupId,
        `New message from ${senderName}`,
        preview,
        'new_message',
        { groupId: dto.groupId, messageId: msg.id },
        userId,
      )
      .catch(() => {});
    return msg;
  }

  async createSystemMessage(groupId: string, content: string) {
    return this.prisma.groupMessage.create({
      data: { groupId, content, type: 'system' },
    });
  }

  async findByGroup(groupId: string, userId: string, before?: string, limit = 50) {
    await this.assertActiveMember(groupId, userId);
    const rows = await this.prisma.groupMessage.findMany({
      where: { groupId, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const hasMore = rows.length === limit;
    const messages = rows.reverse();
    return { messages, nextCursor: hasMore ? messages[0].createdAt.toISOString() : null };
  }

  async findById(messageId: string, userId: string) {
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });
    if (!message) throw new NotFoundException('Message not found');
    await this.assertActiveMember(message.groupId, userId);
    return message;
  }

  async update(messageId: string, dto: UpdateMessageDto, userId: string) {
    const message = await this.prisma.groupMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Not your message');
    if (message.type !== 'user') throw new ForbiddenException('Cannot edit system messages');
    return this.prisma.groupMessage.update({
      where: { id: messageId },
      data: { content: dto.content, editedAt: new Date() },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async softDelete(messageId: string, userId: string) {
    const message = await this.prisma.groupMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) throw new ForbiddenException('Not your message');
    if (message.type !== 'user') throw new ForbiddenException('Cannot delete system messages');
    return this.prisma.groupMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }

  private async assertActiveMember(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, status: 'active' },
    });
    if (!member) throw new ForbiddenException('You are not a member of this group');
  }
}
