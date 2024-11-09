import { Content } from 'src/content/entities/content.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Like } from './like.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  text: string;

  @Column()
  userId: string;

  @Column()
  contentId: string;

  @Column({ nullable: true })
  parentId: string;

  @Column({ default: 0 })
  likeCount: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Content, (content) => content.comments)
  @JoinColumn({ name: 'contentId' })
  content: Content;

  @ManyToOne(() => Comment, (comment) => comment.replies)
  @JoinColumn({ name: 'parentId' })
  parent: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @OneToMany(() => Like, (like) => like.comment)
  likes: Like[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
