import { Module } from '@nestjs/common';
import { WeeklyMenusController } from './weekly-menus.controller';
import { WeeklyMenusService } from './weekly-menus.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [WeeklyMenusController],
  providers: [WeeklyMenusService],
  exports: [WeeklyMenusService],
})
export class WeeklyMenusModule {}
