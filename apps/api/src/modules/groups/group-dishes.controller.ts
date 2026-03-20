import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GroupDishesService } from './group-dishes.service';
import { CreateGroupDishDto } from './dto/create-group-dish.dto';
import { UpdateGroupDishDto } from './dto/update-group-dish.dto';

@Controller('groups/:groupId/dishes')
@UseGuards(JwtAuthGuard)
export class GroupDishesController {
  constructor(private groupDishesService: GroupDishesService) {}

  @Get()
  list(@Param('groupId') groupId: string, @CurrentUser('id') userId: string) {
    return this.groupDishesService.list(groupId, userId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  create(
    @Param('groupId') groupId: string,
    @Body() dto: CreateGroupDishDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupDishesService.create(groupId, dto, file, userId);
  }

  @Patch(':dishId')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  update(
    @Param('groupId') groupId: string,
    @Param('dishId') dishId: string,
    @Body() dto: UpdateGroupDishDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupDishesService.update(groupId, dishId, dto, file, userId);
  }

  @Delete(':dishId')
  remove(
    @Param('groupId') groupId: string,
    @Param('dishId') dishId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.groupDishesService.remove(groupId, dishId, userId);
  }
}
