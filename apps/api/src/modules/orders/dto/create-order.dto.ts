import { IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  groupId: string;

  @IsDateString()
  date: string;

  @IsUUID()
  weeklyMenuItemId: string;

  @IsInt()
  @Min(1)
  @Max(10)
  quantity: number = 1;
}
