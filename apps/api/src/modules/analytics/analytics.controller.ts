import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('personal')
  getPersonal(
    @Query('groupId') groupId: string,
    @Query('period') period: 'weekly' | 'monthly' = 'weekly',
    @CurrentUser('id') userId: string,
  ) {
    return this.analyticsService.getPersonal(userId, groupId, period);
  }

  @Get('personal/top-dishes')
  getTopDishes(
    @Query('groupId') groupId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.analyticsService.getTopDishes(userId, groupId);
  }

  @Get('group')
  getGroupBreakdown(
    @Query('groupId') groupId: string,
    @Query('weekStart') weekStart: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.analyticsService.getGroupWeeklyBreakdown(groupId, userId, weekStart);
  }
}
