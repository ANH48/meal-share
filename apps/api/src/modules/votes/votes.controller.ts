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
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { SubmitVoteDto } from './dto/submit-vote.dto';

@Controller('votes')
@UseGuards(JwtAuthGuard)
export class VotesController {
  constructor(private votesService: VotesService) {}

  @Post()
  create(
    @Body() dto: CreateVoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.votesService.create(dto, userId);
  }

  @Get()
  findByGroup(
    @Query('groupId') groupId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.votesService.findByGroup(groupId, userId);
  }

  @Get(':id')
  findById(
    @Param('id') voteId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.votesService.findById(voteId, userId);
  }

  @Post(':id/respond')
  submitResponse(
    @Param('id') voteId: string,
    @Body() dto: SubmitVoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.votesService.submitResponse(voteId, dto, userId);
  }

  @Get(':id/results')
  getResults(@Param('id') voteId: string) {
    return this.votesService.getResults(voteId);
  }

  @Patch(':id/close')
  closeVote(
    @Param('id') voteId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.votesService.closeVote(voteId, userId);
  }

  @Delete(':id')
  deleteVote(
    @Param('id') voteId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.votesService.deleteVote(voteId, userId);
  }
}
