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
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  create(@Body() dto: CreateMessageDto, @CurrentUser('id') userId: string) {
    return this.messagesService.create(dto, userId);
  }

  @Get()
  findByGroup(
    @Query('groupId') groupId: string,
    @Query('before') before: string | undefined,
    @Query('limit') limit: string | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.findByGroup(groupId, userId, before, limit ? parseInt(limit) : 50);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.messagesService.findById(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.update(id, dto, userId);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.messagesService.softDelete(id, userId);
  }
}
