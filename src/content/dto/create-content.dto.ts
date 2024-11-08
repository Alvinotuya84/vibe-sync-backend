import { IsEnum, IsString, IsArray, IsOptional } from 'class-validator';
import { ContentType } from '../entities/content.entity';

export class CreateContentDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ContentType)
  type: ContentType;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
