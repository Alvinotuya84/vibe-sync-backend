import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@GetUser() user: User) {
    return user;
  }

  @Get(':id/profile')
  async getUserProfile(@Param('id') userId: string) {
    const [user, stats] = await Promise.all([
      this.usersService.findById(userId),
      this.usersService.getUserStats(userId),
    ]);

    return {
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user,
        stats,
      },
    };
  }
}
