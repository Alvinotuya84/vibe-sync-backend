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
  // src/chat/chat.service.ts
  async getConversations(userId: string) {
    try {
      // Get conversations with participants
      const conversations = await this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.participants', 'participants')
        .where((qb) => {
          const subQuery = qb
            .subQuery()
            .select('conversation_participants.conversationsId')
            .from(
              'conversations_participants_users',
              'conversation_participants',
            )
            .where('conversation_participants.usersId = :userId')
            .getQuery();
          return 'conversation.id IN ' + subQuery;
        })
        .setParameter('userId', userId)
        .getMany();

      // Get last messages for these conversations
      const conversationIds = conversations.map((conv) => conv.id);

      let lastMessages: Message[] = [];
      if (conversationIds.length > 0) {
        lastMessages = await this.messageRepository
          .createQueryBuilder('message')
          .where((qb) => {
            const subQuery = qb
              .subQuery()
              .select('DISTINCT ON (m.conversationId) m.id')
              .from(Message, 'm')
              .where('m.conversationId IN (:...conversationIds)')
              .orderBy('m.conversationId')
              .addOrderBy('m.createdAt', 'DESC')
              .getQuery();
            return 'message.id IN ' + subQuery;
          })
          .setParameter('conversationIds', conversationIds)
          .orderBy('message.createdAt', 'DESC')
          .getMany();
      }

      // Create a map for quick lookup of last messages
      const lastMessageMap = new Map(
        lastMessages.map((msg) => [msg.conversationId, msg]),
      );

      // Transform the conversations
      const transformedConversations = conversations.map((conv) => {
        const otherParticipant = conv.participants.find((p) => p.id !== userId);
        return {
          id: conv.id,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          participants: conv.participants,
          otherParticipant,
          lastMessage: lastMessageMap.get(conv.id) || null,
        };
      });

      // Sort by last message date or creation date
      transformedConversations.sort((a, b) => {
        const dateA = a.lastMessage?.createdAt || a.createdAt;
        const dateB = b.lastMessage?.createdAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

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
