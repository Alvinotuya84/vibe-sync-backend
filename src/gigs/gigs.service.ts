import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gig } from './entities/gig.entity';
import { CreateGigDto } from './dto/create-gig.dto';
import { GigFiltersDto } from './dto/gig-filters.dto';
import { UpdateGigDto } from './dto/update-gig.dto';

@Injectable()
export class GigsService {
  constructor(
    @InjectRepository(Gig)
    private gigRepository: Repository<Gig>,
  ) {}

  async createGig(userId: string, createGigDto: CreateGigDto) {
    const gig = this.gigRepository.create({
      ...createGigDto,
      creatorId: userId,
    });
    await this.gigRepository.save(gig);

    return {
      success: true,
      message: 'Gig created successfully',
      data: { gig },
    };
  }

  async getGigs(filters: GigFiltersDto) {
    const queryBuilder = this.gigRepository
      .createQueryBuilder('gig')
      .leftJoinAndSelect('gig.creator', 'creator');

    if (filters.minPrice) {
      queryBuilder.andWhere('gig.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters.maxPrice) {
      queryBuilder.andWhere('gig.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters.skills?.length) {
      queryBuilder.andWhere(':skills = ANY(gig.skills)', {
        skills: filters.skills,
      });
    }

    const [gigs, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      message: 'Gigs retrieved successfully',
      data: { gigs, total },
    };
  }

  async getGigsByUser(userId: string) {
    const gigs = await this.gigRepository.find({
      where: { creatorId: userId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      message: 'User gigs retrieved successfully',
      data: { gigs },
    };
  }

  async getGigById(id: string) {
    const gig = await this.gigRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!gig) {
      throw new NotFoundException('Gig not found');
    }

    return {
      success: true,
      message: 'Gig retrieved successfully',
      data: { gig },
    };
  }

  async updateGig(userId: string, id: string, updateGigDto: UpdateGigDto) {
    const gig = await this.gigRepository.findOne({
      where: { id, creatorId: userId },
    });

    if (!gig) {
      throw new NotFoundException('Gig not found or unauthorized');
    }

    await this.gigRepository.update(id, updateGigDto);

    const updatedGig = await this.gigRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    return {
      success: true,
      message: 'Gig updated successfully',
      data: { gig: updatedGig },
    };
  }

  async deleteGig(userId: string, id: string) {
    const gig = await this.gigRepository.findOne({
      where: { id, creatorId: userId },
    });

    if (!gig) {
      throw new NotFoundException('Gig not found or unauthorized');
    }

    await this.gigRepository.remove(gig);

    return {
      success: true,
      message: 'Gig deleted successfully',
    };
  }

  async getUserGigs(
    userId: string,
    query: { page?: number; limit?: number; status?: string },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.gigRepository
      .createQueryBuilder('gig')
      .leftJoinAndSelect('gig.creator', 'creator')
      .where('gig.creatorId = :userId', { userId })
      .orderBy('gig.createdAt', 'DESC');

    if (query.status) {
      queryBuilder.andWhere('gig.status = :status', { status: query.status });
    }

    const [gigs, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      success: true,
      message: 'User gigs retrieved successfully',
      data: {
        gigs,
        pagination: {
          total,
          page,
          limit,
          hasNextPage: total > skip + limit,
        },
      },
    };
  }
}
