// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { Content } from 'src/content/entities/content.entity';
import { Gig } from 'src/gigs/entities/gig.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Content, Gig])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

// src/modules/users/users.controller.ts
