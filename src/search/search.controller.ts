import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { SearchService } from './search.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { SearchQueryDto } from './dto/dto/search.dto';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@GetUser('id') userId: string, @Query() searchDto: SearchQueryDto) {
    return this.searchService.search(userId, searchDto);
  }

  @Get('recent')
  getRecentSearches(@GetUser('id') userId: string) {
    return this.searchService.getRecentSearches(userId);
  }

  @Get('trending')
  getTrendingSearches() {
    return this.searchService.getTrendingSearches();
  }

  @Get('suggestions')
  getSuggestions(@GetUser('id') userId: string, @Query('query') query: string) {
    return this.searchService.getSearchSuggestions(userId, query);
  }
}
