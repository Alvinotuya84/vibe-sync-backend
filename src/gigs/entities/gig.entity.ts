import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum GigStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  DELETED = 'deleted',
}

@Entity('gigs')
export class Gig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('simple-array')
  skills: string[];

  @Column({
    type: 'enum',
    enum: GigStatus,
    default: GigStatus.ACTIVE,
  })
  status: GigStatus;

  @ManyToOne(() => User)
  @JoinColumn()
  creator: User;

  @Column()
  creatorId: string;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  contactCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
