import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ContentController } from './content.controller';
import { Content } from './entities/content.entity';
import { Module } from '@nestjs/common';
import { ContentService } from './content.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content]),
    MulterModule.register({
      dest: './uploads/content',
    }),
  ],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
