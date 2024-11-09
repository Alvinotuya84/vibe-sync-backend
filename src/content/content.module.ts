import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ContentController } from './content.controller';
import { Content } from './entities/content.entity';
import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { Like } from 'src/interactions/entities/like.entity';
import { Comment } from 'src/interactions/entities/comment.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Subscription } from 'src/modules/users/entities/subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, Like, Comment, Subscription, User]),
    MulterModule.register({
      dest: './uploads/content',
    }),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
