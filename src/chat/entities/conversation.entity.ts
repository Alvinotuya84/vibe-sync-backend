import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { Message } from './message.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User, { eager: false })
  @JoinTable({
    name: 'conversations_participants_users',
    joinColumn: {
      name: 'conversationsId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'usersId',
      referencedColumnName: 'id',
    },
  })
  participants: User[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  // Virtual property for last message
  lastMessage?: Message;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
