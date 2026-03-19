import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
