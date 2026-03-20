import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser('id') userId: string) {
    return this.ordersService.create(dto, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ordersService.remove(id, userId);
  }

  @Get('my')
  getMyDailyOrders(
    @Query('groupId') groupId: string,
    @Query('date') date: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.findUserDailyOrders(userId, groupId, date);
  }

  @Get('my/week')
  getMyWeeklyOrders(
    @Query('groupId') groupId: string,
    @Query('weekStart') weekStart: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.findUserWeeklyOrders(userId, groupId, weekStart);
  }

  @Get('group')
  getGroupDailyOrders(
    @Query('groupId') groupId: string,
    @Query('date') date: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.findGroupDailyOrders(groupId, date, userId);
  }

  @Get('group/week')
  getGroupWeeklySummary(
    @Query('groupId') groupId: string,
    @Query('weekStart') weekStart: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.findGroupWeeklySummary(groupId, weekStart, userId);
  }
}
