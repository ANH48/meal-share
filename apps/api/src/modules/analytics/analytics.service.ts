import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getPersonal(userId: string, groupId: string, period: 'weekly' | 'monthly') {
    await this.assertMember(groupId, userId);
    const days = period === 'weekly' ? 7 : 30;
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - days);

    const [current, previous] = await Promise.all([
      this.prisma.dailyOrder.findMany({
        where: { userId, groupId, date: { gte: start, lte: now } },
        select: { date: true, totalPrice: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.dailyOrder.findMany({
        where: { userId, groupId, date: { gte: prevStart, lt: start } },
        select: { totalPrice: true },
      }),
    ]);

    const totalSpend = current.reduce((s, o) => s + Number(o.totalPrice), 0);
    const prevSpend = previous.reduce((s, o) => s + Number(o.totalPrice), 0);
    const ordersCount = current.length;
    const dailyAverage = ordersCount > 0 ? totalSpend / days : 0;
    const vsLastPeriod = prevSpend > 0 ? ((totalSpend - prevSpend) / prevSpend) * 100 : null;

    // Group by date for trend
    const byDate: Record<string, number> = {};
    for (const o of current) {
      const d = o.date.toISOString().split('T')[0];
      byDate[d] = (byDate[d] ?? 0) + Number(o.totalPrice);
    }
    const trend = Object.entries(byDate).map(([date, amount]) => ({ date, amount }));

    return { totalSpend, dailyAverage, ordersCount, vsLastPeriod, trend };
  }

  async getGroupWeeklyBreakdown(groupId: string, userId: string, weekStart: string) {
    await this.assertMember(groupId, userId);
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const orders = await this.prisma.dailyOrder.findMany({
      where: { groupId, date: { gte: start, lt: end } },
      include: { user: { select: { id: true, name: true } } },
    });

    const groupTotal = orders.reduce((s, o) => s + Number(o.totalPrice), 0);
    const byUser: Record<string, { userId: string; name: string; total: number; ordersCount: number }> = {};
    for (const o of orders) {
      if (!byUser[o.userId]) byUser[o.userId] = { userId: o.userId, name: o.user.name, total: 0, ordersCount: 0 };
      byUser[o.userId].total += Number(o.totalPrice);
      byUser[o.userId].ordersCount += 1;
    }

    const members = Object.values(byUser).map((m) => ({
      ...m,
      percentage: groupTotal > 0 ? (m.total / groupTotal) * 100 : 0,
    })).sort((a, b) => b.total - a.total);

    return { weekStart, groupTotal, totalOrders: orders.length, memberCount: members.length, members };
  }

  async getTopDishes(userId: string, groupId: string, limit = 5) {
    await this.assertMember(groupId, userId);
    const orders = await this.prisma.dailyOrder.findMany({
      where: { userId, groupId },
      include: { weeklyMenuItem: { include: { menuItem: true } } },
    });

    const byDish: Record<string, { menuItemId: string; name: string; category: string; ordersCount: number; totalSpend: number }> = {};
    for (const o of orders) {
      const item = o.weeklyMenuItem.menuItem;
      if (!byDish[item.id]) byDish[item.id] = { menuItemId: item.id, name: item.name, category: item.category ?? '', ordersCount: 0, totalSpend: 0 };
      byDish[item.id].ordersCount += o.quantity;
      byDish[item.id].totalSpend += Number(o.totalPrice);
    }

    const dishes = Object.values(byDish)
      .sort((a, b) => b.ordersCount - a.ordersCount)
      .slice(0, limit);

    return { dishes };
  }

  async getDailySummary(groupId: string, date: Date): Promise<string | null> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const orders = await this.prisma.dailyOrder.findMany({
      where: { groupId, date: { gte: start, lte: end } },
      include: { user: { select: { name: true } } },
    });
    if (orders.length === 0) return null;

    const total = orders.reduce((s, o) => s + Number(o.totalPrice), 0);
    const memberCount = new Set(orders.map((o) => o.userId)).size;
    const formatted = new Intl.NumberFormat('vi-VN').format(total);
    const dateStr = date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });

    return `📊 Tổng kết ${dateStr}: ${memberCount} thành viên đặt cơm, tổng ${formatted}₫`;
  }

  private async assertMember(groupId: string, userId: string) {
    const m = await this.prisma.groupMember.findFirst({ where: { groupId, userId, status: 'active' } });
    if (!m) throw new ForbiddenException('Not a member of this group');
  }
}
