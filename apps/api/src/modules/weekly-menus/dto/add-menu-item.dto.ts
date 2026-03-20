import { IsUUID, IsNumber, Min } from 'class-validator';

export class AddMenuItemDto {
  @IsUUID()
  menuItemId: string;

  @IsNumber()
  @Min(0)
  price: number;
}
