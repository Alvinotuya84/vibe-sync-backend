import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { SettingsController } from './settings.controller';
import { StripeService } from './stripe.service';
import { User } from 'src/modules/users/entities/user.entity';
import { SettingsService } from './settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, StripeService],
})
export class SettingsModule {}
