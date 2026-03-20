import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupDishesController } from './group-dishes.controller';
import { GroupDishesService } from './group-dishes.service';

@Module({
  controllers: [GroupsController, GroupDishesController],
  providers: [GroupsService, GroupDishesService],
  exports: [GroupsService],
})
export class GroupsModule {}
