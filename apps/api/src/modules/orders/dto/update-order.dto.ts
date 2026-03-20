import { IsInt, Min, Max } from 'class-validator';

export class UpdateOrderDto {
  @IsInt()
  @Min(0)
  @Max(10)
  quantity: number;
}
