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
  Query,
  BadRequestException,
  DefaultValuePipe,
  ParseIntPipe,
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
import { FilterContentDto } from './dto/filter-content.dto';
import { User } from 'src/modules/users/entities/user.entity';

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
  @Get('previews/videos')
  async getVideoPreviews(@GetUser() user: User) {
    return this.contentService.getVideoPreviews();
  }

  @Get('community')
  async getCommunityContent(
    @Query() filterDto: FilterContentDto,
    @GetUser() user: User,
  ) {
    return this.contentService.getCommunityContent(filterDto, user);
  }

  @Get(':id')
  async getContentById(@Param('id') id: string, @GetUser() user: User) {
    return this.contentService.getContentById(user.id, id);
  }

  @Post(':id/like')
  async likeContent(@Param('id') id: string, @GetUser() user: User) {
    return this.contentService.likeContent(user.id, id);
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string, @GetUser() user: User) {
    return this.contentService.getComments(id, user.id);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body('text') text: string,
    @Body('parentId') parentId?: string,
  ) {
    return this.contentService.addComment(user.id, id, text, parentId);
  }
  // In your ContentController
  @Get('scroll/feed-videos')
  async getFeedVideos(
    @GetUser() user: User,
    @Query('initialId') initialId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.contentService.getFeedVideos(initialId, user, page, limit);
  }

  // content.controller.ts
}
