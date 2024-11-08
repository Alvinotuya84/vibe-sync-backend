// src/settings/settings.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Patch,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { SettingsService } from './settings.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as path from 'path';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Patch('profile')
  async updateProfile(
    @GetUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.settingsService.updateProfile(userId, updateProfileDto);
  }

  @Post('upload-profile-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/profile-images',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
          );
        },
      }),
    }),
  )
  async uploadProfileImage(
    @GetUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.settingsService.updateProfileImage(userId, file);
  }

  @Post('initiate-verification')
  async initiateVerification(@GetUser('id') userId: string) {
    return this.settingsService.initiateVerification(userId);
  }

  @Post('confirm-verification')
  async confirmVerification(@GetUser('id') userId: string) {
    return this.settingsService.confirmVerification(userId);
  }
}
