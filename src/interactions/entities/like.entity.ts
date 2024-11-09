import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Unique,
} from 'typeorm';
import { Content } from '../../content/entities/content.entity';
import { Comment } from './comment.entity';
import { User } from '../../modules/users/entities/user.entity';

@Entity('likes')
@Unique(['userId', 'contentId', 'commentId']) // Ensure user can only like once
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  contentId: string;

  @Column({ nullable: true })
  commentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Content, (content) => content.likes)
  @JoinColumn({ name: 'contentId' })
  content: Content;

  @ManyToOne(() => Comment, (comment) => comment.likes)
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @CreateDateColumn()
  createdAt: Date;
}
