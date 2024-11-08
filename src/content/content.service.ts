import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content, ContentType } from './entities/content.entity';
import { CreateContentDto } from './dto/create-content.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
  ) {}

  async createContent(
    userId: string,
    createContentDto: CreateContentDto,
    mediaFile: Express.Multer.File,
    thumbnailFile?: Express.Multer.File,
  ) {
    // Validate media type
    if (createContentDto.type === ContentType.VIDEO) {
      if (!mediaFile.mimetype.includes('video')) {
        throw new BadRequestException(
          'Invalid file type. Expected video file.',
        );
      }
      // Require thumbnail for videos
      if (!thumbnailFile) {
        throw new BadRequestException(
          'Thumbnail is required for video content.',
        );
      }
    } else if (createContentDto.type === ContentType.IMAGE) {
      if (!mediaFile.mimetype.includes('image')) {
        throw new BadRequestException(
          'Invalid file type. Expected image file.',
        );
      }
    }

    // Create content with proper paths based on content type
    const content = this.contentRepository.create({
      ...createContentDto,
      creatorId: userId,
      mediaPath: this.formatMediaPath(mediaFile.path, createContentDto.type),
      thumbnailPath: thumbnailFile
        ? this.formatMediaPath(thumbnailFile.path, 'thumbnail')
        : null,
      isPublished: false, // Always start as draft
    });

    await this.contentRepository.save(content);

    return {
      success: true,
      message: 'Content created successfully',
      data: { content },
    };
  }

  private formatMediaPath(
    filePath: string,
    type: ContentType | 'thumbnail',
  ): string {
    // Ensure consistent path format and organize by content type
    const relativePath = filePath.replace(/\\/g, '/');
    return `uploads/${type}/${path.basename(relativePath)}`;
  }

  async publishContent(userId: string, contentId: string) {
    const content = await this.contentRepository.findOne({
      where: { id: contentId, creatorId: userId },
    });

    if (!content) {
      throw new BadRequestException('Content not found');
    }

    // Additional validation before publishing
    if (content.type === ContentType.VIDEO && !content.thumbnailPath) {
      throw new BadRequestException('Cannot publish video without thumbnail');
    }

    content.isPublished = true;
    await this.contentRepository.save(content);

    return {
      success: true,
      message: 'Content published successfully',
      data: { content },
    };
  }

  async getDraftContent(userId: string) {
    const drafts = await this.contentRepository.find({
      where: { creatorId: userId, isPublished: false },
      order: { createdAt: 'DESC' },
    });

    // Group drafts by content type for better organization
    const groupedDrafts = {
      videos: drafts.filter((draft) => draft.type === ContentType.VIDEO),
      images: drafts.filter((draft) => draft.type === ContentType.IMAGE),
    };

    return {
      success: true,
      message: 'Drafts retrieved successfully',
      data: { drafts: groupedDrafts },
    };
  }

  async getContentById(userId: string, contentId: string) {
    const content = await this.contentRepository.findOne({
      where: { id: contentId, creatorId: userId },
    });

    if (!content) {
      throw new BadRequestException('Content not found');
    }

    return {
      success: true,
      message: 'Content retrieved successfully',
      data: { content },
    };
  }

  async deleteContent(userId: string, contentId: string) {
    const content = await this.contentRepository.findOne({
      where: { id: contentId, creatorId: userId },
    });

    if (!content) {
      throw new BadRequestException('Content not found');
    }

    // Delete media files
    try {
      const mediaPath = path.join(process.cwd(), content.mediaPath);
      await fs.unlink(mediaPath);

      if (content.thumbnailPath) {
        const thumbnailPath = path.join(process.cwd(), content.thumbnailPath);
        await fs.unlink(thumbnailPath);
      }
    } catch (error) {
      console.error('Error deleting content files:', error);
      // Continue with content deletion even if file deletion fails
    }

    await this.contentRepository.remove(content);

    return {
      success: true,
      message: 'Content deleted successfully',
      data: null,
    };
  }

  // Helper method to get content stats
  async getContentStats(userId: string) {
    const [videos, images] = await Promise.all([
      this.contentRepository.count({
        where: { creatorId: userId, type: ContentType.VIDEO },
      }),
      this.contentRepository.count({
        where: { creatorId: userId, type: ContentType.IMAGE },
      }),
    ]);

    return {
      success: true,
      message: 'Content stats retrieved successfully',
      data: {
        totalContent: videos + images,
        videoCount: videos,
        imageCount: images,
      },
    };
  }
}
