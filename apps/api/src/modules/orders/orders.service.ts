import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto, userId: string) {
    await this.verifyActiveMember(dto.groupId, userId);

    const weeklyMenuItem = await this.prisma.weeklyMenuItem.findUnique({
      where: { id: dto.weeklyMenuItemId },
      include: { weeklyMenu: true, menuItem: true },
    });

    if (!weeklyMenuItem) throw new NotFoundException('Menu item not found');
    if (weeklyMenuItem.weeklyMenu.groupId !== dto.groupId) {
      throw new BadRequestException('Menu item does not belong to this group');
    }
    if (weeklyMenuItem.weeklyMenu.status !== 'confirmed') {
      throw new BadRequestException('Can only order from a confirmed weekly menu');
    }
    if (weeklyMenuItem.weeklyMenu.isLocked) {
      throw new BadRequestException('Orders are locked for this week');
    }

    const date = new Date(dto.date);
    const unitPrice = Number(weeklyMenuItem.price);
    const totalPrice = unitPrice * dto.quantity;

    return this.prisma.dailyOrder.upsert({
      where: {
        userId_groupId_date_weeklyMenuItemId: {
          userId,
          groupId: dto.groupId,
          date,
          weeklyMenuItemId: dto.weeklyMenuItemId,
        },
      },
      create: {
        userId,
        groupId: dto.groupId,
        date,
        weeklyMenuItemId: dto.weeklyMenuItemId,
        quantity: dto.quantity,
        unitPrice,
        totalPrice,
      },
      update: {
        quantity: dto.quantity,
        totalPrice,
      },
      include: {
        weeklyMenuItem: { include: { menuItem: true } },
      },
    });
  }

  async update(orderId: string, dto: UpdateOrderDto, userId: string) {
    const order = await this.prisma.dailyOrder.findUnique({
      where: { id: orderId },
      include: { weeklyMenuItem: { include: { weeklyMenu: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Not your order');
    if (order.weeklyMenuItem.weeklyMenu.isLocked) {
      throw new BadRequestException('Orders are locked for this week');
    }

    if (dto.quantity === 0) {
      await this.prisma.dailyOrder.delete({ where: { id: orderId } });
      return { deleted: true };
    }

    // Use stored unitPrice so price changes on the menu don't affect existing orders
    const unitPrice = Number(order.unitPrice) || Number(order.weeklyMenuItem.price);
    const totalPrice = unitPrice * dto.quantity;
    return this.prisma.dailyOrder.update({
      where: { id: orderId },
      data: { quantity: dto.quantity, totalPrice },
      include: { weeklyMenuItem: { include: { menuItem: true } } },
    });
  }

  async remove(orderId: string, userId: string) {
    const order = await this.prisma.dailyOrder.findUnique({
      where: { id: orderId },
      include: { weeklyMenuItem: { include: { weeklyMenu: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Not your order');
    if (order.weeklyMenuItem.weeklyMenu.isLocked) {
      throw new BadRequestException('Orders are locked for this week');
    }
    return this.prisma.dailyOrder.delete({ where: { id: orderId } });
  }

  async findUserDailyOrders(userId: string, groupId: string, date: string) {
    return this.prisma.dailyOrder.findMany({
      where: { userId, groupId, date: new Date(date) },
      include: { weeklyMenuItem: { include: { menuItem: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findUserWeeklyOrders(userId: string, groupId: string, weekStart: string) {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return this.prisma.dailyOrder.findMany({
      where: {
        userId,
        groupId,
        date: { gte: start, lt: end },
      },
      include: { weeklyMenuItem: { include: { menuItem: true } } },
      orderBy: { date: 'asc' },
    });
  }

  async findGroupDailyOrders(groupId: string, date: string, requesterId: string) {
    await this.verifyGroupLeader(groupId, requesterId);

    return this.prisma.dailyOrder.findMany({
      where: { groupId, date: new Date(date) },
      include: {
        user: { select: { id: true, name: true, email: true } },
        weeklyMenuItem: { include: { menuItem: true } },
      },
      orderBy: [{ userId: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findGroupWeeklySummary(groupId: string, weekStart: string, requesterId: string) {
    await this.verifyGroupLeader(groupId, requesterId);

    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const orders = await this.prisma.dailyOrder.findMany({
      where: {
        groupId,
        date: { gte: start, lt: end },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        weeklyMenuItem: { include: { menuItem: true } },
      },
      orderBy: [{ userId: 'asc' }, { date: 'asc' }],
    });

    const byUser = orders.reduce(
      (acc, o) => {
        const uid = o.userId;
        if (!acc[uid]) acc[uid] = { user: o.user, orders: [], total: 0 };
        acc[uid].orders.push(o);
        acc[uid].total += Number(o.totalPrice);
        return acc;
      },
      {} as Record<string, { user: { id: string; name: string; email: string }; orders: typeof orders; total: number }>,
    );

    return Object.values(byUser);
  }

  private async verifyActiveMember(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, status: 'active' },
    });
    if (!member) throw new ForbiddenException('You are not an active member of this group');
  }

  private async verifyGroupLeader(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, status: 'active', role: 'leader' },
    });
    if (!member) throw new ForbiddenException('Only the group leader can view group orders');
  }
}
