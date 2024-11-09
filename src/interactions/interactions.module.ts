import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteractionsService } from './interactions.service';
import { Like } from './entities/like.entity';
import { Comment } from './entities/comment.entity';
import { Content } from '../content/entities/content.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { InteractionsController } from './interactions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Comment, Content, User])],
  providers: [InteractionsService],
  controllers: [InteractionsController],
  exports: [InteractionsService],
})
export class InteractionsModule {}
