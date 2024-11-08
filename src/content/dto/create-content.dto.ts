// src/content/dto/create-content.dto.ts
import {
  IsEnum,
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
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
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isPublished?: boolean;
}
