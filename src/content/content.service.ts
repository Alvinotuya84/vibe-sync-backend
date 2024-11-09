import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Content, ContentType } from './entities/content.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { Like } from 'src/interactions/entities/like.entity';
import { Comment } from 'src/interactions/entities/comment.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { FilterContentDto, FeedType } from './dto/filter-content.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Subscription } from 'src/modules/users/entities/subscription.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private subscriptionRepository: Repository<Subscription>,
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

    // Create content with proper paths
    const content = this.contentRepository.create({
      ...createContentDto,
      creatorId: userId,
      mediaPath: this.formatMediaPath(mediaFile.path, createContentDto.type),
      thumbnailPath: thumbnailFile
        ? this.formatMediaPath(thumbnailFile.path, 'thumbnail')
        : null,
      isPublished: false,
    });

    await this.contentRepository.save(content);

    return {
      success: true,
      message: 'Content created successfully',
      data: { content },
    };
  }

  async getCommunityContent(filterDto: FilterContentDto, user: User) {
    const { feed = FeedType.FOR_YOU, page = 1, limit = 10 } = filterDto;

    const queryBuilder = this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.creator', 'creator')
      .where('content.isPublished = :isPublished', { isPublished: true });

    switch (feed.toLowerCase()) {
      case FeedType.SUBSCRIBED:
        queryBuilder.innerJoin(
          'user_subscriptions',
          'sub',
          'sub.creatorId = creator.id AND sub.subscriberId = :userId AND sub.isActive = :isActive',
          { userId: user.id, isActive: true },
        );
        break;

      case FeedType.TRENDING:
        queryBuilder
          .orderBy('content.viewCount', 'DESC')
          .addOrderBy('content.likeCount', 'DESC')
          .andWhere('content.createdAt >= :date', {
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          });
        break;

      case FeedType.LIFE:
        queryBuilder.andWhere(`content.tags::jsonb ? :tag`, { tag: 'life' });
        // Or if tags is stored as an array:
        // .andWhere(':tag = ANY(content.tags)', { tag: 'life' });
        break;

      default: // FOR_YOU
        queryBuilder
          .orderBy('content.createdAt', 'DESC')
          .addOrderBy('content.likeCount', 'DESC');
    }

    // Add pagination
    const skip = (page - 1) * limit;
    const [contents, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Get likes for these contents for the current user
    const userLikes = await this.likeRepository.find({
      where: {
        userId: user.id,
        contentId: In(contents.map((c) => c.id)),
      },
    });

    // Get user's subscriptions
    const userSubscriptions = await this.subscriptionRepository.find({
      where: {
        subscriberId: user.id,
        creatorId: In(contents.map((c) => c.creatorId)),
        isActive: true,
      },
    });

    // Enrich content with user-specific data
    const enrichedContents = contents.map((content) => ({
      ...content,
      isLiked: userLikes.some((like) => like.contentId === content.id),
      isSubscribed: userSubscriptions.some(
        (sub) => sub.creatorId === content.creatorId,
      ),
    }));

    return {
      success: true,
      message: 'Content retrieved successfully',
      data: {
        contents: enrichedContents,
        pagination: {
          total,
          page,
          limit,
          hasNextPage: total > skip + limit,
        },
      },
    };
  }
  async publishContent(userId: string, contentId: string) {
    const content = await this.contentRepository.findOne({
      where: { id: contentId, creatorId: userId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

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

  async likeContent(userId: string, contentId: string) {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { userId, contentId },
    });

    if (existingLike) {
      await this.likeRepository.remove(existingLike);
      content.likeCount--;
    } else {
      const like = this.likeRepository.create({
        userId,
        contentId,
      });
      await this.likeRepository.save(like);
      content.likeCount++;
    }

    await this.contentRepository.save(content);

    return {
      success: true,
      message: existingLike ? 'Content unliked' : 'Content liked',
      data: { isLiked: !existingLike },
    };
  }

  async addComment(
    userId: string,
    contentId: string,
    text: string,
    parentId?: string,
  ) {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const commentData: Partial<Comment> = {
      text,
      userId,
      contentId,
      parentId,
    };

    const comment = this.commentRepository.create(commentData);
    await this.commentRepository.save(comment);

    // Update content comments count
    content.commentsCount++;
    await this.contentRepository.save(content);

    return {
      success: true,
      message: 'Comment added successfully',
      data: { comment },
    };
  }

  async getComments(contentId: string, userId: string) {
    const comments = await this.commentRepository.find({
      where: {
        contentId,
        parentId: null, // Get only top-level comments
      },
      relations: ['user', 'replies', 'replies.user'],
      order: {
        createdAt: 'DESC',
      },
    });

    // Get all comment IDs (including replies) for like checking
    const allCommentIds = comments.reduce((acc, comment) => {
      acc.push(comment.id);
      comment.replies?.forEach((reply) => acc.push(reply.id));
      return acc;
    }, [] as string[]);

    // Get all likes for these comments in one query
    const likes = await this.likeRepository.find({
      where: {
        userId,
        commentId: In(allCommentIds),
      },
    });

    const likedCommentIds = new Set(likes.map((like) => like.commentId));

    const enrichedComments = comments.map((comment) => ({
      ...comment,
      isLiked: likedCommentIds.has(comment.id),
      replies:
        comment.replies?.map((reply) => ({
          ...reply,
          isLiked: likedCommentIds.has(reply.id),
        })) || [],
    }));

    return {
      success: true,
      message: 'Comments retrieved successfully',
      data: { comments: enrichedComments },
    };
  }

  async getDraftContent(userId: string) {
    const drafts = await this.contentRepository.find({
      where: { creatorId: userId, isPublished: false },
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      message: 'Drafts retrieved successfully',
      data: {
        drafts: {
          videos: drafts.filter((d) => d.type === ContentType.VIDEO),
          images: drafts.filter((d) => d.type === ContentType.IMAGE),
        },
      },
    };
  }

  async deleteContent(userId: string, contentId: string) {
    const content = await this.contentRepository.findOne({
      where: { id: contentId, creatorId: userId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
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
    }

    // Delete associated likes and comments
    await this.likeRepository.delete({ contentId });
    await this.commentRepository.delete({ contentId });
    await this.contentRepository.remove(content);

    return {
      success: true,
      message: 'Content deleted successfully',
    };
  }

  private formatMediaPath(
    filePath: string,
    type: ContentType | 'thumbnail',
  ): string {
    const relativePath = filePath.replace(/\\/g, '/');
    return `uploads/${type}/${path.basename(relativePath)}`;
  }

  private async hasUserLikedContent(
    userId: string,
    contentId: string,
  ): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: { userId, contentId },
    });
    return !!like;
  }

  private async hasUserLikedComment(
    userId: string,
    commentId: string,
  ): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: { userId, commentId },
    });
    return !!like;
  }

  private async isUserSubscribedTo(
    userId: string,
    creatorId: string,
  ): Promise<boolean> {
    // Implement based on your subscription entity
    return false;
  }

  async getContentStats(userId: string) {
    const stats = await this.contentRepository
      .createQueryBuilder('content')
      .where('content.creatorId = :userId', { userId })
      .select([
        'COUNT(*) as totalContent',
        'SUM(CASE WHEN type = :videoType THEN 1 ELSE 0 END) as videoCount',
        'SUM(CASE WHEN type = :imageType THEN 1 ELSE 0 END) as imageCount',
        'SUM("likeCount") as totalLikes',
        'SUM("viewCount") as totalViews',
        'SUM("commentsCount") as totalComments',
      ])
      .setParameters({
        videoType: ContentType.VIDEO,
        imageType: ContentType.IMAGE,
      })
      .getRawOne();

    return {
      success: true,
      message: 'Content stats retrieved successfully',
      data: stats,
    };
  }
  async deleteComments(contentId: string) {
    // First delete all replies
    await this.commentRepository
      .createQueryBuilder()
      .delete()
      .from(Comment)
      .where('contentId = :contentId', { contentId })
      .execute();
  }
  async likeComment(userId: string, commentId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: {
        userId,
        commentId,
      },
    });

    if (existingLike) {
      await this.likeRepository.remove(existingLike);
      comment.likeCount--;
    } else {
      const like = this.likeRepository.create({
        userId,
        commentId,
      });
      await this.likeRepository.save(like);
      comment.likeCount++;
    }

    await this.commentRepository.save(comment);

    return {
      success: true,
      message: existingLike ? 'Comment unliked' : 'Comment liked',
      data: { isLiked: !existingLike },
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
}
