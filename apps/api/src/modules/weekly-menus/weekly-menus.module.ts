import { Module } from '@nestjs/common';
import { WeeklyMenusController } from './weekly-menus.controller';
import { WeeklyMenusService } from './weekly-menus.service';

@Module({
  controllers: [WeeklyMenusController],
  providers: [WeeklyMenusService],
  exports: [WeeklyMenusService],
})
export class WeeklyMenusModule {}
