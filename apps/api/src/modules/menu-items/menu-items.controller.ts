import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MenuItemsService } from './menu-items.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { QueryMenuItemDto } from './dto/query-menu-item.dto';

@Controller('menu-items')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class MenuItemsController {
  constructor(private menuItemsService: MenuItemsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  create(
    @Body() dto: CreateMenuItemDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.menuItemsService.create(dto, file, userId);
  }

  @Get()
  findAll(@Query() query: QueryMenuItemDto) {
    return this.menuItemsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.menuItemsService.findById(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.menuItemsService.update(id, dto, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.menuItemsService.remove(id);
  }
}
