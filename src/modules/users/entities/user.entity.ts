import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Content } from 'src/content/entities/content.entity';
import { Gig } from 'src/gigs/entities/gig.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  refreshToken?: string;

  @Column({ nullable: true })
  profileImagePath: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ default: 'free' })
  accountType: 'free' | 'verified';

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  website: string;

  // New subscriberId column
  @Column({ nullable: true, unique: true })
  subscriberId?: string;

  @Column({ nullable: true })
  creatorId?: string;
  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Content, (content) => content.creator)
  posts: Content[];

  @OneToMany(() => Gig, (gig) => gig.creator)
  gigs: Gig[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async updatePassword(newPassword: string) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(newPassword, salt);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
