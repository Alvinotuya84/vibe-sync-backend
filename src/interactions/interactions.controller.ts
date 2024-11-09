import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';

import { InteractionsService } from './interactions.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('interactions')
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  constructor(private interactionsService: InteractionsService) {}

  @Post('like/:contentId')
  toggleLike(
    @GetUser('id') userId: string,
    @Param('contentId') contentId: string,
  ) {
    return this.interactionsService.toggleLike(userId, contentId);
  }

  @Post('comment')
  createComment(
    @GetUser('id') userId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.interactionsService.createComment(userId, createCommentDto);
  }

  @Get('comments/:contentId')
  getComments(
    @GetUser('id') userId: string,
    @Param('contentId') contentId: string,
  ) {
    return this.interactionsService.getComments(contentId, userId);
  }

  @Post('comment/like/:commentId')
  toggleCommentLike(
    @GetUser('id') userId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.interactionsService.toggleCommentLike(userId, commentId);
  }

  @Get('comment/replies/:commentId')
  getReplies(
    @GetUser('id') userId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.interactionsService.getReplies(commentId, userId);
  }
}
