import { IsUUID, IsDateString } from 'class-validator';

export class CreateWeeklyMenuDto {
  @IsUUID()
  groupId: string;

  @IsDateString()
  weekStartDate: string;
}
