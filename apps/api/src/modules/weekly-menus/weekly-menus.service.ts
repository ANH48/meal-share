import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWeeklyMenuDto } from './dto/create-weekly-menu.dto';
import { AddMenuItemDto } from './dto/add-menu-item.dto';

@Injectable()
export class WeeklyMenusService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWeeklyMenuDto, userId: string) {
    await this.verifyGroupLeader(dto.groupId, userId);

    const weekStart = new Date(dto.weekStartDate);
    const existing = await this.prisma.weeklyMenu.findFirst({
      where: {
        groupId: dto.groupId,
        weekStartDate: weekStart,
        status: { in: ['draft', 'confirmed'] },
      },
    });
    if (existing) {
      throw new ConflictException('A menu already exists for this week');
    }

    return this.prisma.weeklyMenu.create({
      data: {
        groupId: dto.groupId,
        weekStartDate: weekStart,
        createdBy: userId,
        status: 'draft',
      },
      include: { items: { include: { menuItem: true } } },
    });
  }

  async findByGroupAndWeek(groupId: string, weekStartDate: string) {
    const weekStart = new Date(weekStartDate);
    return this.prisma.weeklyMenu.findFirst({
      where: { groupId, weekStartDate: weekStart },
      include: { items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(menuId: string) {
    const menu = await this.prisma.weeklyMenu.findUnique({
      where: { id: menuId },
      include: { items: { include: { menuItem: true } } },
    });
    if (!menu) throw new NotFoundException('Weekly menu not found');
    return menu;
  }

  async addItem(menuId: string, dto: AddMenuItemDto, userId: string) {
    const menu = await this.findById(menuId);
    await this.verifyGroupLeader(menu.groupId, userId);

    return this.prisma.weeklyMenuItem.create({
      data: {
        weeklyMenuId: menuId,
        menuItemId: dto.menuItemId,
        price: dto.price,
      },
      include: { menuItem: true },
    });
  }

  async removeItem(menuId: string, itemId: string, userId: string) {
    const menu = await this.findById(menuId);
    await this.verifyGroupLeader(menu.groupId, userId);

    const item = await this.prisma.weeklyMenuItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.weeklyMenuId !== menuId) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.weeklyMenuItem.delete({ where: { id: itemId } });
  }

  async updateItemPrice(
    menuId: string,
    itemId: string,
    price: number,
    userId: string,
  ) {
    const menu = await this.findById(menuId);
    await this.verifyGroupLeader(menu.groupId, userId);

    const item = await this.prisma.weeklyMenuItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.weeklyMenuId !== menuId) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.weeklyMenuItem.update({
      where: { id: itemId },
      data: { price },
      include: { menuItem: true },
    });
  }

  async confirm(menuId: string, userId: string) {
    const menu = await this.findById(menuId);
    await this.verifyGroupLeader(menu.groupId, userId);

    const conflicting = await this.prisma.weeklyMenu.findFirst({
      where: {
        groupId: menu.groupId,
        weekStartDate: menu.weekStartDate,
        status: 'confirmed',
        NOT: { id: menuId },
      },
    });
    if (conflicting) {
      throw new ConflictException('A confirmed menu already exists for this week');
    }

    return this.prisma.weeklyMenu.update({
      where: { id: menuId },
      data: { status: 'confirmed' },
      include: { items: { include: { menuItem: true } } },
    });
  }

  private async verifyGroupLeader(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, status: 'active', role: 'leader' },
    });
    if (!member) {
      throw new ForbiddenException('Only the group leader can perform this action');
    }
  }
}
