import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';

import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('start/:userId')
  async startConversation(
    @GetUser('id') currentUserId: string,
    @Param('userId') otherUserId: string,
  ) {
    return this.chatService.startConversation(currentUserId, otherUserId);
  }

  @Get('conversations')
  async getConversations(@GetUser('id') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get(':conversationId/messages')
  async getMessages(
    @GetUser('id') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.getMessages(conversationId, userId);
  }

  @Post(':conversationId/messages')
  async sendMessage(
    @GetUser('id') userId: string,
    @Param('conversationId') conversationId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      userId,
      conversationId,
      sendMessageDto.text,
    );
  }
}
