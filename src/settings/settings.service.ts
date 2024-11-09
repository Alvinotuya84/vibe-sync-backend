import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { StripeService } from './stripe.service';
import { User } from 'src/modules/users/entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';

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

    // Use query builder to update only specific fields
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({
        bio: updateProfileDto.bio,
        location: updateProfileDto.location,
        website: updateProfileDto.website,
        // Add any other fields from your DTO
      })
      .where('id = :id', { id: userId })
      .execute();

    // Fetch updated user
    const updatedUser = await this.usersRepository.findOne({
      where: { id: userId },
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    };
  }

  async updateProfileImage(userId: string, file: Express.Multer.File) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Delete old image if exists
    if (user.profileImagePath) {
      try {
        await fs.unlink(path.join(process.cwd(), user.profileImagePath));
      } catch (error) {
        console.error('Error deleting old profile image:', error);
      }
    }

    // Use query builder to update only profile image
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ profileImagePath: file.path })
      .where('id = :id', { id: userId })
      .execute();

    // Fetch updated user
    const updatedUser = await this.usersRepository.findOne({
      where: { id: userId },
    });

    return {
      success: true,
      message: 'Profile image updated successfully',
      data: { user: updatedUser },
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
  async updatePassword(
    userId: string,
    { currentPassword, newPassword }: UpdatePasswordDto,
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await user.validatePassword(currentPassword);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    await user.updatePassword(newPassword);

    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ password: user.password })
      .where('id = :id', { id: userId })
      .execute();

    return {
      success: true,
      message: 'Password updated successfully',
    };
  }
}
