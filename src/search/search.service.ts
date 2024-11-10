import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Content } from 'src/content/entities/content.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { SearchHistory } from './entities/search-history.entity';
import { Gig } from 'src/gigs/entities/gig.entity';
import { SearchQueryDto } from './dto/dto/search.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(Gig)
    private gigRepository: Repository<Gig>,
    @InjectRepository(SearchHistory)
    private searchHistoryRepository: Repository<SearchHistory>,
  ) {}

  async search(userId: string, searchDto: SearchQueryDto) {
    const { query, type, page = 1, limit = 20 } = searchDto;
    const skip = (page - 1) * limit;

    await this.searchHistoryRepository.save({
      query,
      userId,
    });

    let users = [],
      posts = [],
      gigs = [];

    if (type === 'all' || type === 'users') {
      users = await this.userRepository
        .createQueryBuilder('user')
        .where('user.username ILIKE :query', { query: `%${query}%` })
        .orWhere('user.bio ILIKE :query', { query: `%${query}%` })
        .take(limit)
        .skip(skip)
        .getMany();
    }

    if (type === 'all' || type === 'posts') {
      posts = await this.contentRepository
        .createQueryBuilder('content')
        .where('content.title ILIKE :query', { query: `%${query}%` })
        .orWhere('content.description ILIKE :query', { query: `%${query}%` })
        .take(limit)
        .skip(skip)
        .getMany();
    }

    if (type === 'all' || type === 'gigs') {
      gigs = await this.gigRepository
        .createQueryBuilder('gig')
        .where('gig.title ILIKE :query', { query: `%${query}%` })
        .orWhere('gig.description ILIKE :query', { query: `%${query}%` })
        .take(limit)
        .skip(skip)
        .getMany();
    }

    return {
      success: true,
      message: 'Search results retrieved successfully',
      data: {
        users,
        posts,
        gigs,
      },
    };
  }

  async getRecentSearches(userId: string) {
    const searches = await this.searchHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      success: true,
      message: 'Recent searches retrieved successfully',
      data: { searches },
    };
  }

  async getTrendingSearches() {
    const trendingSearches = await this.searchHistoryRepository
      .createQueryBuilder('search')
      .select('search.query')
      .addSelect('COUNT(*)', 'count')
      .groupBy('search.query')
      .orderBy('count', 'DESC')
      .take(10)
      .getRawMany();

    return {
      success: true,
      message: 'Trending searches retrieved successfully',
      data: { searches: trendingSearches },
    };
  }

  async getSearchSuggestions(userId: string, query: string) {
    const suggestions = await this.searchHistoryRepository
      .createQueryBuilder('search')
      .select('search.query')
      .where('search.query ILIKE :query', { query: `${query}%` })
      .distinct(true)
      .take(5)
      .getRawMany();

    return {
      success: true,
      message: 'Search suggestions retrieved successfully',
      data: { suggestions },
    };
  }
}
