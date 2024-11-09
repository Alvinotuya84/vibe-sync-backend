import { Comment } from '../../interactions/entities/comment.entity';
import { Like } from '../../interactions/entities/like.entity';
import { User } from '../../modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

export enum ContentType {
  VIDEO = 'video',
  IMAGE = 'image',
}

@Entity('content')
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ContentType,
  })
  type: ContentType;

  @Column()
  mediaPath: string;

  @Column({ nullable: true })
  thumbnailPath: string;

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column()
  creatorId: string;

  @OneToMany(() => Like, (like) => like.content)
  likes: Like[];

  @OneToMany(() => Comment, (comment) => comment.content)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
