import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Comment } from './entities/comment.entity';
import { Content } from '../content/entities/content.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async toggleLike(userId: string, contentId: string) {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['creator'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const existingLike = await this.likesRepository.findOne({
      where: {
        userId,
        contentId,
      },
    });

    if (existingLike) {
      await this.likesRepository.remove(existingLike);
      content.likeCount--;
    } else {
      const newLike = this.likesRepository.create({
        userId,
        contentId,
      });
      await this.likesRepository.save(newLike);
      content.likeCount++;
    }

    await this.contentRepository.save(content);

    return {
      success: true,
      message: existingLike ? 'Like removed' : 'Content liked',
      data: { isLiked: !existingLike, likeCount: content.likeCount },
    };
  }

  async toggleCommentLike(userId: string, commentId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const existingLike = await this.likesRepository.findOne({
      where: {
        userId,
        commentId,
      },
    });

    if (existingLike) {
      await this.likesRepository.remove(existingLike);
      comment.likeCount--;
    } else {
      const newLike = this.likesRepository.create({
        userId,
        commentId,
      });
      await this.likesRepository.save(newLike);
      comment.likeCount++;
    }

    await this.commentsRepository.save(comment);

    return {
      success: true,
      message: existingLike ? 'Like removed' : 'Comment liked',
      data: { isLiked: !existingLike, likeCount: comment.likeCount },
    };
  }

  async getComments(contentId: string, userId: string) {
    const comments = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.parentComment', 'parentComment')
      .leftJoin(
        Like,
        'like',
        'like.commentId = comment.id AND like.userId = :userId',
        { userId },
      )
      .addSelect(
        'CASE WHEN like.id IS NOT NULL THEN true ELSE false END',
        'isLiked',
      )
      .where('comment.contentId = :contentId', { contentId })
      .andWhere('comment.parentComment IS NULL')
      .orderBy('comment.createdAt', 'DESC')
      .getRawAndEntities();

    const formattedComments = comments.entities.map((comment, index) => ({
      ...comment,
      isLiked: !!comments.raw[index].isLiked,
    }));

    return {
      success: true,
      message: 'Comments retrieved successfully',
      data: { comments: formattedComments },
    };
  }

  async getReplies(commentId: string, userId: string) {
    const replies = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoin(
        Like,
        'like',
        'like.commentId = comment.id AND like.userId = :userId',
        { userId },
      )
      .addSelect(
        'CASE WHEN like.id IS NOT NULL THEN true ELSE false END',
        'isLiked',
      )
      .where('comment.parentCommentId = :commentId', { commentId })
      .orderBy('comment.createdAt', 'ASC')
      .getRawAndEntities();

    const formattedReplies = replies.entities.map((reply, index) => ({
      ...reply,
      isLiked: !!replies.raw[index].isLiked,
    }));

    return {
      success: true,
      message: 'Replies retrieved successfully',
      data: { replies: formattedReplies },
    };
  }

  async createComment(userId: string, createCommentDto: CreateCommentDto) {
    const content = await this.contentRepository.findOne({
      where: { id: createCommentDto.contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    let parent: Comment | null = null;
    if (createCommentDto.parentCommentId) {
      parent = await this.commentsRepository.findOne({
        where: { id: createCommentDto.parentCommentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    // Create comment with the correct property names matching the entity
    const comment = this.commentsRepository.create({
      text: createCommentDto.text,
      userId: userId,
      contentId: createCommentDto.contentId,
      parentId: parent?.id || null,
      likeCount: 0,
    });

    // Save the new comment
    const savedComment = await this.commentsRepository.save(comment);

    // Load the comment with relations for the response
    const commentWithRelations = await this.commentsRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user', 'content', 'parent'],
    });

    // Update content comments count
    content.commentsCount++;
    await this.contentRepository.save(content);

    return {
      success: true,
      message: 'Comment created successfully',
      data: { comment: commentWithRelations },
    };
  }
}
