import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GigsController } from './gigs.controller';
import { GigsService } from './gigs.service';
import { Gig } from './entities/gig.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Gig]), NotificationsModule],
  controllers: [GigsController],
  providers: [GigsService],
  exports: [GigsService],
})
export class GigsModule {}
