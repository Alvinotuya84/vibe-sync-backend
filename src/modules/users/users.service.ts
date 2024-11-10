import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async setRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.usersRepository.update(userId, { refreshToken });
  }
  async findByUsernames(usernames: string[]): Promise<User[]> {
    if (!usernames.length) return [];

    return this.usersRepository.find({
      where: {
        username: In(usernames), // Using TypeORM's In operator
      },
      select: ['id', 'username', 'profileImagePath', 'isVerified'], // Only select needed fields
    });
  }
  async validateUsername(username: string): Promise<boolean> {
    // Username requirements:
    // - Must start with a letter
    // - Can contain letters, numbers, underscores, and dots
    // - Cannot have consecutive dots or underscores
    // - Must be between 3 and 30 characters
    const usernameRegex = /^[a-zA-Z][\w.]*(?:[._]?[a-zA-Z0-9])*$/;
    const isValidFormat =
      usernameRegex.test(username) &&
      username.length >= 3 &&
      username.length <= 30;

    if (!isValidFormat) {
      return false;
    }

    // Check if username already exists
    const existingUser = await this.usersRepository.findOne({
      where: { username },
    });

    return !existingUser;
  }

  async getMentionSuggestions(
    query: string,
    excludeUserIds: string[] = [],
    limit: number = 5,
  ): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) LIKE LOWER(:query)', { query: `${query}%` })
      .andWhere('user.id NOT IN (:...excludeUserIds)', { excludeUserIds })
      .take(limit)
      .getMany();
  }
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) LIKE LOWER(:query)', { query: `%${query}%` })
      .take(limit)
      .getMany();
  }
  formatUsername(username: string): string {
    return username.toLowerCase().trim();
  }
  async getUserStats(userId: string) {
    const stats = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .loadRelationCountAndMap('user.postsCount', 'user.posts')
      .loadRelationCountAndMap('user.gigsCount', 'user.gigs')
      .getOne();

    return stats;
  }
}
