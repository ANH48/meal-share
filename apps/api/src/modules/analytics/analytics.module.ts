import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DailySummaryCron } from './cron/daily-summary.cron';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, MessagesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, DailySummaryCron],
})
export class AnalyticsModule {}
