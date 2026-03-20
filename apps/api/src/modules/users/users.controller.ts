import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Patch('fcm-token')
  updateFcmToken(
    @CurrentUser('id') userId: string,
    @Body('token') token: string,
  ) {
    return this.usersService.updateFcmToken(userId, token);
  }
}
