import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { StripeService } from './stripe.service';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private stripeService: StripeService,
  ) {}

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    Object.assign(user, updateProfileDto);
    await this.usersRepository.save(user);

    return {
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    };
  }

  async updateProfileImage(userId: string, file: Express.Multer.File) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // If there's an existing profile image, delete it
    if (user.profileImagePath) {
      try {
        await fs.unlink(path.join(process.cwd(), user.profileImagePath));
      } catch (error) {
        console.error('Error deleting old profile image:', error);
      }
    }

    user.profileImagePath = file.path;
    await this.usersRepository.save(user);

    return {
      success: true,
      message: 'Profile image updated successfully',
      data: { user },
    };
  }

  async initiateVerification(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    const paymentIntent = await this.stripeService.createPaymentIntent();

    return {
      success: true,
      message: 'Verification payment initiated',
      data: { clientSecret: paymentIntent.client_secret },
    };
  }

  async confirmVerification(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.isVerified = true;
    user.accountType = 'verified';
    await this.usersRepository.save(user);

    return {
      success: true,
      message: 'Account verified successfully',
      data: { user },
    };
  }
}
