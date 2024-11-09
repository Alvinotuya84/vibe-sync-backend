import { IsEnum, IsOptional } from 'class-validator';

export enum FeedType {
  FOR_YOU = 'for-you',
  SUBSCRIBED = 'subscribed',
  TRENDING = 'trending',
  LIFE = 'life',
}

export class FilterContentDto {
  @IsEnum(FeedType)
  @IsOptional()
  feed?: FeedType;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
