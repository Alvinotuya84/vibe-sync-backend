// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from 'src/modules/auth/guards/ws-jwt-auth.guard';
import { ChatEventsService } from './chat-events';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
@UseGuards(WsJwtAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(private chatEventsService: ChatEventsService) {
    // Subscribe to chat events
    this.chatEventsService.subscribe((event) => {
      switch (event.type) {
        case 'newMessage':
          this.server
            .to(`conversation:${event.conversationId}`)
            .emit('newMessage', event.data);
          break;
        case 'typing':
          this.server
            .to(`conversation:${event.conversationId}`)
            .emit('typing', event.data);
          break;
      }
    });
  }

  handleConnection(client: Socket) {
    const userId = client.data.user.id;
    if (userId) {
      const userSocketIds = this.userSockets.get(userId) || new Set();
      userSocketIds.add(client.id);
      this.userSockets.set(userId, userSocketIds);
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user.id;
    if (userId) {
      const userSocketIds = this.userSockets.get(userId);
      if (userSocketIds) {
        userSocketIds.delete(client.id);
        if (userSocketIds.size === 0) {
          this.userSockets.delete(userId);
        } else {
          this.userSockets.set(userId, userSocketIds);
        }
      }
      client.leave(`user:${userId}`);
    }
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(client: Socket, conversationId: string) {
    client.join(`conversation:${conversationId}`);
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(client: Socket, conversationId: string) {
    client.leave(`conversation:${conversationId}`);
  }
}
