import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGroupDishDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
