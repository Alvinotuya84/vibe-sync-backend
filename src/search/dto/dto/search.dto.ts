import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsEnum(['all', 'users', 'posts', 'gigs'])
  @IsOptional()
  type?: 'all' | 'users' | 'posts' | 'gigs' = 'all';

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}
