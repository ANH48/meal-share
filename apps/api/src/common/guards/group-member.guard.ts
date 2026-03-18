import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class GroupMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user: { id: string } }>();
    const groupIdParam = request.params?.groupId;
    const groupId =
      (Array.isArray(groupIdParam) ? groupIdParam[0] : groupIdParam) ||
      (request.body as Record<string, string>)?.groupId;

    if (!groupId) {
      return true;
    }

    const userId = request.user?.id;
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, status: 'active' },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }

    (request as unknown as Record<string, unknown>).groupMember = member;
    return true;
  }
}
