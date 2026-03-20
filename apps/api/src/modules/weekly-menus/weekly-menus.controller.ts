import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WeeklyMenusService } from './weekly-menus.service';
import { CreateWeeklyMenuDto } from './dto/create-weekly-menu.dto';
import { AddMenuItemDto } from './dto/add-menu-item.dto';

@Controller('weekly-menus')
@UseGuards(JwtAuthGuard)
export class WeeklyMenusController {
  constructor(private weeklyMenusService: WeeklyMenusService) {}

  @Post()
  create(
    @Body() dto: CreateWeeklyMenuDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.weeklyMenusService.create(dto, userId);
  }

  @Get()
  findByGroupAndWeek(
    @Query('groupId') groupId: string,
    @Query('weekStart') weekStart: string,
  ) {
    return this.weeklyMenusService.findByGroupAndWeek(groupId, weekStart);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.weeklyMenusService.findById(id);
  }

  @Post(':id/items')
  addItem(
    @Param('id') menuId: string,
    @Body() dto: AddMenuItemDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.weeklyMenusService.addItem(menuId, dto, userId);
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @Param('id') menuId: string,
    @Param('itemId') itemId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.weeklyMenusService.removeItem(menuId, itemId, userId);
  }

  @Patch(':id/items/:itemId')
  updateItemPrice(
    @Param('id') menuId: string,
    @Param('itemId') itemId: string,
    @Body('price') price: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.weeklyMenusService.updateItemPrice(menuId, itemId, price, userId);
  }

  @Patch(':id/confirm')
  confirm(
    @Param('id') menuId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.weeklyMenusService.confirm(menuId, userId);
  }

  @Patch(':id/lock')
  lockMenu(@Param('id') menuId: string, @CurrentUser('id') userId: string) {
    return this.weeklyMenusService.lockMenu(menuId, userId);
  }

  @Patch(':id/unlock')
  unlockMenu(@Param('id') menuId: string, @CurrentUser('id') userId: string) {
    return this.weeklyMenusService.unlockMenu(menuId, userId);
  }
}
