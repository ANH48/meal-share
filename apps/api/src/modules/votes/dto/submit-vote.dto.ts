import { IsUUID } from 'class-validator';

export class SubmitVoteDto {
  @IsUUID()
  voteOptionId: string;
}
