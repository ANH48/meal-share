import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateWeeklyMenuDto } from './dto/create-weekly-menu.dto';
import { AddMenuItemDto } from './dto/add-menu-item.dto';

function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const INCLUDE_ITEMS = { items: { include: { menuItem: true } } } as const;

@Injectable()
export class WeeklyMenusService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateWeeklyMenuDto, userId: string) {
    await this.verifyGroupLeader(dto.groupId, userId);
    const weekStart = new Date(dto.weekStartDate);

    if (dto.menuDate) {
      const menuDate = new Date(dto.menuDate);
      if (isDateInPast(menuDate)) {
        throw new BadRequestException('Cannot create a menu for a past date');
      }
      const existing = await this.prisma.weeklyMenu.findFirst({
        where: { groupId: dto.groupId, menuDate, status: { in: ['draft', 'confirmed'] } },
      });
      if (existing) throw new ConflictException('A menu already exists for this date');

      return this.prisma.weeklyMenu.create({
        data: { groupId: dto.groupId, weekStartDate: weekStart, menuDate, createdBy: userId },
        include: INCLUDE_ITEMS,
      });
    }

    // Weekly menu: week must not have ended (weekStart + 6 days >= today)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (isDateInPast(weekEnd)) {
      throw new BadRequestException('Cannot create a menu for a past week');
    }

    const existing = await this.prisma.weeklyMenu.findFirst({
      where: { groupId: dto.groupId, weekStartDate: weekStart, menuDate: null, status: { in: ['draft', 'confirmed'] } },
    });
    if (existing) throw new ConflictException('A menu already exists for this week');

    return this.prisma.weeklyMenu.create({
      data: { groupId: dto.groupId, weekStartDate: weekStart, createdBy: userId },
      include: INCLUDE_ITEMS,
    });
  }

  async findByGroupAndWeek(groupId: string, weekStartDate: string) {
    const weekStart = new Date(weekStartDate);
    return this.prisma.weeklyMenu.findFirst({
      where: { groupId, weekStartDate: weekStart, menuDate: null },
      include: INCLUDE_ITEMS,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByGroupAndDate(groupId: string, date: string) {
    const target = new Date(date);

    // Priority 1: exact daily menu for this date
    const daily = await this.prisma.weeklyMenu.findFirst({
      where: { groupId, menuDate: target },
      include: INCLUDE_ITEMS,
      orderBy: { createdAt: 'desc' },
    });
    if (daily) return { ...daily, menuType: 'daily' as const };

    // Priority 2: weekly menu whose week contains this date
    const weekStart = getWeekStart(target);
    const weekly = await this.prisma.weeklyMenu.findFirst({
      where: { groupId, weekStartDate: weekStart, menuDate: null },
      include: INCLUDE_ITEMS,
      orderBy: { createdAt: 'desc' },
    });
    return weekly ? { ...weekly, menuType: 'weekly' as const } : null;
  }

  async findById(menuId: string) {
    const menu = await this.prisma.weeklyMenu.findUnique({
      where: { id: menuId },
      include: INCLUDE_ITEMS,
    });
    if (!menu) throw new NotFoundException('Weekly menu not found');
    return menu;
  }

  async addItem(menuId: string, dto: AddMenuItemDto, userId: string) {
    const menu = await this.findById(menuId);
    await this.verifyGroupLeader(menu.groupId, userId);
    return this.prisma.weeklyMenuItem.create({
      data: { weeklyMenuId: menuId, menuItemId: dto.menuItemId, price: dto.price },
      include: { menuItem: true },
    });
  }

  async removeItem(menuId: string, itemId: string, userId: string) {
    const menu = await this.findById(menuId);
    await this.verifyGroupLeader(menu.groupId, userId);
    const item = await this.prisma.weeklyMenuItem.findUnique({ where: { id: itemId } });
    if (!item || item.weeklyMenuId !== menuId) throw new NotFoundException('Menu item not found');
    return this.prisma.weeklyMenuItem.delete({ where: { id: itemId } });
  }

  async updateItemPrice(menuId: string, itemId: string, price: number, userId: string) {
    const menu = await this.findById(menuId);
    await this.verifyGroupLeader(menu.groupId, userId);
    const item = await this.prisma.weeklyMenuItem.findUnique({ where: { id: itemId } });
    if (!item || item.weeklyMenuId !== menuId) throw new NotFoundException('Menu item not found');
    return this.prisma.weeklyMenuItem.update({ where: { id: itemId }, data: { price }, include: { menuItem: true } });
  }

  async getDayLock(groupId: string, date: string): Promise<{ isLocked: boolean }> {
    const d = new Date(date + 'T00:00:00');
    const lock = await this.prisma.groupDayLock.findUnique({
      where: { groupId_date: { groupId, date: d } },
    });
    return { isLocked: !!lock };
  }

  async setDayLock(groupId: string, userId: string, date: string, lock: boolean): Promise<{ isLocked: boolean }> {
    await this.verifyGroupLeader(groupId, userId);
    const d = new Date(date + 'T00:00:00');
    if (lock) {
      await this.prisma.groupDayLock.upsert({
        where: { groupId_date: { groupId, date: d } },
        create: { groupId, date: d },
        update: {},
      });
    } else {
      await this.prisma.groupDayLock.deleteMany({ where: { groupId, date: d } });
    }
    return { isLocked: lock };
  }

  async confirm(menuId: string, userId: string) {
    const menu = await this.findById(menuId);
    await this.verifyGroupLeader(menu.groupId, userId);

    const conflictWhere = menu.menuDate
      ? { groupId: menu.groupId, menuDate: menu.menuDate, status: 'confirmed' as const, NOT: { id: menuId } }
      : { groupId: menu.groupId, weekStartDate: menu.weekStartDate, menuDate: null, status: 'confirmed' as const, NOT: { id: menuId } };

    const conflicting = await this.prisma.weeklyMenu.findFirst({ where: conflictWhere });
    if (conflicting) {
      throw new ConflictException(
        menu.menuDate ? 'A confirmed menu already exists for this date' : 'A confirmed menu already exists for this week',
      );
    }

    const label = menu.menuDate ? "This day's menu is ready!" : "This week's menu is ready. Start placing orders!";
    return this.prisma.weeklyMenu.update({
      where: { id: menuId },
      data: { status: 'confirmed' },
      include: INCLUDE_ITEMS,
    }).then((result) => {
      this.notifications.notifyGroup(menu.groupId, '📋 Menu Confirmed', label, 'menu_confirmed', {}, userId).catch(() => {});
      return result;
    });
  }

  private async verifyGroupLeader(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, status: 'active', role: 'leader' },
    });
    if (!member) throw new ForbiddenException('Only the group leader can perform this action');
  }
}
