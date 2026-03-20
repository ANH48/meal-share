import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsService } from '../analytics.service';
import { MessagesService } from '../../messages/messages.service';

@Injectable()
export class DailySummaryCron {
  private readonly logger = new Logger(DailySummaryCron.name);

  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
    private messagesService: MessagesService,
  ) {}

  @Cron('0 20 * * *') // 8PM UTC daily
  async sendDailySummaries() {
    this.logger.log('Running daily summary cron...');
    const today = new Date();

    const activeGroups = await this.prisma.group.findMany({
      where: { members: { some: { status: 'active' } } },
      select: { id: true, name: true },
    });

    for (const group of activeGroups) {
      try {
        const summary = await this.analyticsService.getDailySummary(group.id, today);
        if (summary) {
          await this.messagesService.createSystemMessage(group.id, summary);
          this.logger.log(`Sent summary to group ${group.name}`);
        }
      } catch (err) {
        this.logger.error(`Failed for group ${group.id}: ${(err as Error).message}`);
      }
    }
  }
}
