import { IsUUID, IsDateString, IsOptional } from 'class-validator';

export class CreateWeeklyMenuDto {
  @IsUUID()
  groupId: string;

  @IsDateString()
  weekStartDate: string;

  @IsOptional()
  @IsDateString()
  menuDate?: string;
}
