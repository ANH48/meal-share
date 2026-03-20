import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { SubmitVoteDto } from './dto/submit-vote.dto';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVoteDto, userId: string) {
    await this.verifyGroupLeader(dto.groupId, userId);

    return this.prisma.$transaction(async (tx) => {
      const vote = await tx.vote.create({
        data: {
          groupId: dto.groupId,
          title: dto.title,
          weekStartDate: new Date(dto.weekStartDate),
          createdBy: userId,
          endsAt: new Date(dto.endsAt),
          status: 'open',
        },
      });

      await tx.voteOption.createMany({
        data: dto.menuItemIds.map((menuItemId) => ({
          voteId: vote.id,
          menuItemId,
        })),
      });

      return tx.vote.findUnique({
        where: { id: vote.id },
        include: {
          options: { include: { menuItem: true } },
          _count: { select: { responses: true } },
        },
      });
    });
  }

  async findByGroup(groupId: string) {
    return this.prisma.vote.findMany({
      where: { groupId },
      include: {
        options: {
          include: {
            menuItem: true,
            _count: { select: { responses: true } },
          },
        },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(voteId: string, userId?: string) {
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
      include: {
        options: {
          include: {
            menuItem: true,
            _count: { select: { responses: true } },
          },
        },
        _count: { select: { responses: true } },
      },
    });

    if (!vote) throw new NotFoundException('Vote not found');

    if (userId) {
      const userResponse = await this.prisma.voteResponse.findUnique({
        where: { voteId_userId: { voteId, userId } },
      });
      return { ...vote, userResponse: userResponse ?? undefined };
    }

    return vote;
  }

  async submitResponse(voteId: string, dto: SubmitVoteDto, userId: string) {
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
    });
    if (!vote) throw new NotFoundException('Vote not found');
    if (vote.status !== 'open') {
      throw new BadRequestException('This vote is no longer open');
    }
    if (new Date() > vote.endsAt) {
      throw new BadRequestException('This vote has expired');
    }

    const existing = await this.prisma.voteResponse.findUnique({
      where: { voteId_userId: { voteId, userId } },
    });
    if (existing) throw new ConflictException('You have already voted');

    const option = await this.prisma.voteOption.findUnique({
      where: { id: dto.voteOptionId },
    });
    if (!option || option.voteId !== voteId) {
      throw new NotFoundException('Vote option not found');
    }

    return this.prisma.voteResponse.create({
      data: { voteId, userId, voteOptionId: dto.voteOptionId },
    });
  }

  async getResults(voteId: string) {
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
      include: {
        options: {
          include: {
            menuItem: true,
            _count: { select: { responses: true } },
          },
        },
        _count: { select: { responses: true } },
      },
    });

    if (!vote) throw new NotFoundException('Vote not found');

    const totalResponses = vote._count.responses;

    return vote.options.map((option) => {
      const count = option._count.responses;
      const percentage = totalResponses > 0
        ? Math.round((count / totalResponses) * 100)
        : 0;
      return {
        optionId: option.id,
        menuItemName: option.menuItem.name,
        count,
        percentage,
      };
    });
  }

  async closeExpiredVotes() {
    await this.prisma.vote.updateMany({
      where: { status: 'open', endsAt: { lt: new Date() } },
      data: { status: 'closed' },
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleVoteAutoClose() {
    await this.closeExpiredVotes();
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
