import { User } from 'src/modules/users/entities/user.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';

export interface ConversationWithDetails extends Conversation {
  otherParticipant: User;
  lastMessage: Message | null;
}
