import { Content } from 'src/content/entities/content.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  text: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Content)
  @JoinColumn()
  content: Content;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn()
  parentComment: Comment;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: 0 })
  likesCount: number;
}
