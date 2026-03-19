import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGroupDto, userId: string) {
    const inviteCode = nanoid(10);
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: dto.name,
          description: dto.description,
          leaderId: userId,
          inviteCode,
        },
      });
      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId,
          role: 'leader',
          status: 'active',
        },
      });
      return tx.group.findUnique({
        where: { id: group.id },
        include: { members: { include: { user: true } } },
      });
    });
  }

  async findUserGroups(userId: string) {
    return this.prisma.group.findMany({
      where: {
        members: { some: { userId, status: 'active' } },
      },
      include: {
        _count: { select: { members: { where: { status: 'active' } } } },
        members: {
          where: { userId },
          select: { role: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { status: 'active' },
          include: { user: true },
        },
        _count: { select: { members: { where: { status: 'active' } } } },
      },
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async joinByInviteCode(code: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { inviteCode: code },
    });
    if (!group) throw new NotFoundException('Invalid invite code');

    const existing = await this.prisma.groupMember.findFirst({
      where: { groupId: group.id, userId, status: 'active' },
    });
    if (existing) throw new ConflictException('Already a member of this group');

    await this.prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId } },
      update: { status: 'active', role: 'participant', removedAt: null },
      create: {
        groupId: group.id,
        userId,
        role: 'participant',
        status: 'active',
      },
    });

    return this.findById(group.id);
  }

  async removeMember(groupId: string, targetUserId: string, requesterId: string) {
    await this.verifyLeader(groupId, requesterId);

    const target = await this.prisma.groupMember.findFirst({
      where: { groupId, userId: targetUserId, status: 'active' },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'leader') {
      throw new ForbiddenException('Cannot remove the group leader');
    }

    return this.prisma.groupMember.update({
      where: { id: target.id },
      data: { status: 'removed', removedAt: new Date() },
    });
  }

  async leaveGroup(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, status: 'active' },
    });
    if (!member) throw new NotFoundException('Membership not found');
    if (member.role === 'leader') {
      throw new ForbiddenException('Leader cannot leave. Transfer leadership first.');
    }

    return this.prisma.groupMember.update({
      where: { id: member.id },
      data: { status: 'removed', removedAt: new Date() },
    });
  }

  async regenerateInviteCode(groupId: string, userId: string) {
    await this.verifyLeader(groupId, userId);
    const inviteCode = nanoid(10);
    const group = await this.prisma.group.update({
      where: { id: groupId },
      data: { inviteCode },
    });
    return { inviteCode: group.inviteCode };
  }

  async update(groupId: string, dto: UpdateGroupDto, userId: string) {
    await this.verifyLeader(groupId, userId);
    return this.prisma.group.update({
      where: { id: groupId },
      data: { name: dto.name, description: dto.description },
    });
  }

  async getMembers(groupId: string) {
    return this.prisma.groupMember.findMany({
      where: { groupId, status: 'active' },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  private async verifyLeader(groupId: string, userId: string): Promise<void> {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, status: 'active', role: 'leader' },
    });
    if (!member) throw new ForbiddenException('Only the group leader can perform this action');
  }
}
