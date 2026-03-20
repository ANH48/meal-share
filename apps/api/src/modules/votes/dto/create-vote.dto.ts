import { IsUUID, IsString, IsDateString, IsArray, ArrayMinSize } from 'class-validator';

export class CreateVoteDto {
  @IsUUID()
  groupId: string;

  @IsString()
  title: string;

  @IsDateString()
  weekStartDate: string;

  @IsDateString()
  endsAt: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsUUID(undefined, { each: true })
  menuItemIds: string[];
}
