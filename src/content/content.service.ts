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
      mediaPath: `uploads/content/media/${path.basename(mediaFile.path)}`,
      thumbnailPath: thumbnailFile
        ? `uploads/content/thumbnail/${path.basename(thumbnailFile.path)}`
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
    try {
      const queryBuilder = this.contentRepository
        .createQueryBuilder('content')
        .leftJoinAndSelect('content.creator', 'creator')
        .orderBy('content.createdAt', 'DESC');

      const page = filterDto.page || 1;
      const limit = filterDto.limit || 10;
      const skip = (page - 1) * limit;

      queryBuilder.skip(skip).take(limit);

      const [contents, total] = await queryBuilder.getManyAndCount();

      // Map contents to response format with correct paths
      const enrichedContents = contents.map((content) => ({
        id: content.id,
        title: content.title,
        description: content.description,
        type: content.type,
        // Update paths to match your structure
        mediaPath: `${process.env.BASE_URL}/uploads/content/media/${path.basename(content.mediaPath)}`,
        thumbnailPath: content.thumbnailPath
          ? `${process.env.BASE_URL}/uploads/content/thumbnail/${path.basename(content.thumbnailPath)}`
          : null,
        tags: content.tags || [],
        likeCount: content.likeCount || 0,
        viewCount: content.viewCount || 0,
        commentsCount: content.commentsCount || 0,
        creator: {
          id: content.creator?.id,
          username: content.creator?.username,
          profileImageUrl: content.creator?.profileImagePath
            ? `${process.env.BASE_URL}/uploads/profile/${path.basename(content.creator.profileImagePath)}`
            : null,
          isVerified: content.creator?.isVerified || false,
        },
        createdAt: content.createdAt,
        isLiked: false, // You can implement this later
        isSubscribed: false, // You can implement this later
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
    } catch (error) {
      console.error('Error in getCommunityContent:', error);
      throw error;
    }
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
    if (type === 'thumbnail') {
      return `uploads/content/thumbnail/${path.basename(relativePath)}`;
    }
    return `uploads/content/media/${path.basename(relativePath)}`;
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
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        subscriberId: userId,
        creatorId: creatorId,
        isActive: true,
      },
    });
    return !!subscription;
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

  // Add these methods to your ContentService class

  async subscribeToCreator(userId: string, creatorId: string) {
    // Check if already subscribed
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        subscriberId: userId,
        creatorId: creatorId,
      },
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        throw new BadRequestException('Already subscribed to this creator');
      }
      // Reactivate subscription
      existingSubscription.isActive = true;
      await this.subscriptionRepository.save(existingSubscription);
    } else {
      // Create new subscription
      const subscription = this.subscriptionRepository.create({
        subscriberId: userId,
        creatorId: creatorId,
        isActive: true,
      });
      await this.subscriptionRepository.save(subscription);
    }

    return {
      success: true,
      message: 'Successfully subscribed to creator',
    };
  }

  async unsubscribeFromCreator(subscriberId: string, creatorId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        subscriberId,
        creatorId,
        isActive: true,
      },
    });

    if (!subscription) {
      throw new BadRequestException('Not subscribed to this creator');
    }

    subscription.isActive = false;
    await this.subscriptionRepository.save(subscription);

    return {
      success: true,
      message: 'Successfully unsubscribed from creator',
    };
  }

  async getSubscribedCreators(userId: string) {
    const subscriptions = await this.subscriptionRepository.find({
      where: {
        subscriberId: userId,
        isActive: true,
      },
      relations: ['creator'],
    });

    return {
      success: true,
      message: 'Subscribed creators retrieved successfully',
      data: {
        creators: subscriptions.map((sub) => sub.creator),
      },
    };
  }

  // Add this method to get single content with subscription status
  async getContentWithDetails(contentId: string, userId: string) {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['creator'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Get user-specific data
    const [isLiked, isSubscribed] = await Promise.all([
      this.hasUserLikedContent(userId, contentId),
      this.isUserSubscribedTo(userId, content.creatorId),
    ]);

    // Increment view count
    content.viewCount++;
    await this.contentRepository.save(content);

    return {
      success: true,
      message: 'Content retrieved successfully',
      data: {
        content: {
          ...content,
          isLiked,
          isSubscribed,
        },
      },
    };
  }
  async getSubscriptions(userId: string) {
    const subscriptions = await this.subscriptionRepository.find({
      where: {
        subscriberId: userId,
        isActive: true,
      },
      relations: ['creator'],
    });

    return {
      success: true,
      message: 'Subscriptions retrieved successfully',
      data: {
        subscriptions: subscriptions.map((sub) => ({
          id: sub.id,
          creator: {
            id: sub.creator.id,
            username: sub.creator.username,
            // Add other creator fields you want to return
          },
          createdAt: sub.createdAt,
        })),
      },
    };
  }

  // Add this function to ContentService
  async checkDatabaseContent() {
    try {
      // Get all content without any filters
      const allContent = await this.contentRepository.find({
        relations: ['creator'],
      });

      console.log(
        'Database check - All content:',
        JSON.stringify(allContent, null, 2),
      );
      console.log('Total content count:', allContent.length);

      // Check content table structure
      const columns = await this.contentRepository.metadata.columns;
      console.log(
        'Content table columns:',
        columns.map((col) => col.propertyName),
      );

      return {
        success: true,
        message: 'Database check completed',
        data: {
          contentCount: allContent.length,
          columns: columns.map((col) => col.propertyName),
          sampleContent: allContent.slice(0, 3), // Show first 3 items
        },
      };
    } catch (error) {
      console.error('Error checking database:', error);
      throw error;
    }
  }
}
