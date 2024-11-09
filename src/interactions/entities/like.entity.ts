import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Content } from '../../content/entities/content.entity';
import { Comment } from './comment.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'userId' })
  userId: string;

  @ManyToOne(() => Content, { nullable: true })
  @JoinColumn({ name: 'contentId' })
  content: Content;

  @Column({ name: 'contentId', nullable: true })
  contentId: string;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @Column({ name: 'commentId', nullable: true })
  commentId: string;

  @CreateDateColumn()
  createdAt: Date;
}
