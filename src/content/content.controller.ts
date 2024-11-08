// src/content/content.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Delete,
  Param,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { ContentType } from './entities/content.entity';
import * as path from 'path';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { ensureDirectoryExists, UPLOAD_PATHS } from '../utils/file.utils';

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private contentService: ContentService) {
    // Ensure upload directories exist when controller is initialized
    this.initializeUploadDirectories();
  }
  private async initializeUploadDirectories() {
    await Promise.all([
      ensureDirectoryExists(UPLOAD_PATHS.CONTENT.MEDIA),
      ensureDirectoryExists(UPLOAD_PATHS.CONTENT.THUMBNAILS),
    ]);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'media', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            cb(null, `./uploads/content/${file.fieldname}`);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(
              null,
              `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
            );
          },
        }),
        fileFilter: (req, file, cb) => {
          const dto = req.body as CreateContentDto;
          if (dto.type === ContentType.VIDEO) {
            if (
              file.fieldname === 'media' &&
              !file.mimetype.includes('video')
            ) {
              return cb(new Error('Only video files are allowed'), false);
            }
          } else if (dto.type === ContentType.IMAGE) {
            if (
              file.fieldname === 'media' &&
              !file.mimetype.includes('image')
            ) {
              return cb(new Error('Only image files are allowed'), false);
            }
          }
          cb(null, true);
        },
      },
    ),
  )
  async createContent(
    @GetUser('id') userId: string,
    @Body() createContentDto: CreateContentDto,
    @UploadedFiles()
    files: {
      media?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    console.log('Received DTO:', createContentDto);
    console.log('Received Files:', files);
    if (!files?.media?.[0]) {
      throw new BadRequestException('Media file is required');
    }

    return this.contentService.createContent(
      userId,
      createContentDto,
      files.media[0],
      files.thumbnail?.[0],
    );
  }

  @Post(':id/publish')
  async publishContent(
    @GetUser('id') userId: string,
    @Param('id') contentId: string,
  ) {
    return this.contentService.publishContent(userId, contentId);
  }

  @Get('drafts')
  async getDraftContent(@GetUser('id') userId: string) {
    return this.contentService.getDraftContent(userId);
  }

  @Delete(':id')
  async deleteContent(
    @GetUser('id') userId: string,
    @Param('id') contentId: string,
  ) {
    return this.contentService.deleteContent(userId, contentId);
  }
}
