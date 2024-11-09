// src/chat/chat.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { ChatGateway } from './chat.gateway';
import { ChatEventsService } from './chat-events';
import { ConversationWithDetails } from './types/chat.types';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private notificationsService: NotificationsService,
    private chatEventsService: ChatEventsService, // Changed from ChatGateway
  ) {}

  async startConversation(userId: string, otherUserId: string) {
    // Check if conversation already exists
    const existingConversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'participant')
      .where('participant.id IN (:...userIds)', {
        userIds: [userId, otherUserId],
      })
      .groupBy('conversation.id')
      .having('COUNT(DISTINCT participant.id) = 2')
      .getOne();

    if (existingConversation) {
      return {
        success: true,
        message: 'Conversation retrieved',
        data: { conversation: existingConversation },
      };
    }

    // Create new conversation
    const conversation = this.conversationRepository.create({
      participants: [{ id: userId }, { id: otherUserId }],
    });

    await this.conversationRepository.save(conversation);

    return {
      success: true,
      message: 'Conversation created',
      data: { conversation },
    };
  }

  async sendMessage(userId: string, conversationId: string, text: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = this.messageRepository.create({
      text,
      senderId: userId,
      conversationId,
    });

    await this.messageRepository.save(message);

    // Emit new message through WebSocket
    this.chatEventsService.emit({
      type: 'newMessage',
      conversationId,
      data: message,
    });
    // Notify other participant
    const otherParticipant = conversation.participants.find(
      (p) => p.id !== userId,
    );
    if (otherParticipant) {
      await this.notificationsService.createNotification(
        otherParticipant.id,
        NotificationType.MESSAGE,
        'New Message',
        `You have a new message`,
        {
          conversationId,
          messageId: message.id,
        },
        `/chat/${conversationId}`,
      );
    }

    return {
      success: true,
      message: 'Message sent',
      data: { message },
    };
  }

  // src/chat/chat.service.ts
  async getConversations(userId: string) {
    try {
      const conversations = await this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.participants', 'participant')
        .leftJoin(
          'messages',
          'lastMessage',
          `lastMessage.conversationId = conversation.id AND 
           lastMessage."createdAt" = (
             SELECT MAX("createdAt") 
             FROM messages 
             WHERE "conversationId" = conversation.id
           )`,
        )
        .select([
          'conversation',
          'participant',
          'lastMessage.id',
          'lastMessage.text',
          'lastMessage.createdAt',
          'lastMessage.senderId',
          'lastMessage.isRead',
        ])
        .where((qb) => {
          const subQuery = qb
            .subQuery()
            .select('cp.conversationsId')
            .from('conversations_participants_users', 'cp')
            .where('cp.usersId = :userId')
            .getQuery();
          return 'conversation.id IN ' + subQuery;
        })
        .setParameter('userId', userId)
        .orderBy('lastMessage.createdAt', 'DESC')
        .getMany();

      // Transform the result with proper typing
      const transformedConversations: ConversationWithDetails[] =
        conversations.map((conv) => ({
          ...conv,
          otherParticipant: conv.participants.find((p) => p.id !== userId)!,
          lastMessage: (conv as any).lastMessage || null,
        }));

      return {
        success: true,
        message: 'Conversations retrieved successfully',
        data: {
          conversations: transformedConversations,
        },
      };
    } catch (error) {
      console.error('Error in getConversations:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string, userId: string) {
    const messages = await this.messageRepository.find({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });

    // Mark messages as read
    await this.messageRepository.update(
      {
        conversationId,
        senderId: userId,
        isRead: false,
      },
      { isRead: true },
    );

    return {
      success: true,
      message: 'Messages retrieved',
      data: { messages },
    };
  }
}
