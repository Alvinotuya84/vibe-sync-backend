import { IsEnum, IsOptional } from 'class-validator';

// src/content/dto/filter-content.dto.ts
export enum FeedType {
  FOR_YOU = 'for-you',
  SUBSCRIBED = 'subscribed',
  TRENDING = 'trending',
  LIFE = 'life',
}

export class FilterContentDto {
  @IsEnum(FeedType)
  @IsOptional()
  feed?: FeedType = FeedType.FOR_YOU; // Set default

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 10;
}
