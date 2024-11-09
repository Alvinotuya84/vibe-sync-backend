import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_subscriptions')
@Unique(['subscriberId', 'creatorId'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subscriberId: string;

  @Column()
  creatorId: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'subscriberId' })
  subscriber: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;
}
