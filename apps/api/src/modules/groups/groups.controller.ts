import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GroupMemberGuard } from '../../common/guards/group-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  create(@Body() dto: CreateGroupDto, @CurrentUser('id') userId: string) {
    return this.groupsService.create(dto, userId);
  }

  @Get()
  findUserGroups(@CurrentUser('id') userId: string) {
    return this.groupsService.findUserGroups(userId);
  }

  // NOTE: /join must be before /:groupId to avoid route collision
  @Post('join')
  join(
    @Body('code') code: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupsService.joinByInviteCode(code, userId);
  }

  @Get(':groupId')
  @UseGuards(GroupMemberGuard)
  findById(@Param('groupId') groupId: string) {
    return this.groupsService.findById(groupId);
  }

  @Patch(':groupId')
  update(
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupsService.update(groupId, dto, userId);
  }

  @Get(':groupId/members')
  @UseGuards(GroupMemberGuard)
  getMembers(@Param('groupId') groupId: string) {
    return this.groupsService.getMembers(groupId);
  }

  @Delete(':groupId/members/:memberId')
  removeMember(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupsService.removeMember(groupId, memberId, userId);
  }

  @Post(':groupId/leave')
  leaveGroup(
    @Param('groupId') groupId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupsService.leaveGroup(groupId, userId);
  }

  @Post(':groupId/regenerate-invite')
  regenerateInviteCode(
    @Param('groupId') groupId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupsService.regenerateInviteCode(groupId, userId);
  }
}
