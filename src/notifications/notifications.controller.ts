import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/modules/users/entities/user.entity';
import { NotificationSettings } from './dto/notification-settings.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @GetUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('unreadOnly') unreadOnly = false,
  ) {
    if (unreadOnly) {
      return this.notificationsService.getUnreadNotifications(user.id);
    }

    const skip = (page - 1) * limit;
    const notifications = await this.notificationsService.getNotifications(
      user.id,
      skip,
      limit,
    );

    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications,
    };
  }

  @Post(':id/read')
  async markAsRead(@GetUser() user: User, @Param('id') notificationId: string) {
    await this.notificationsService.markAsRead(user.id, notificationId);
    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  @Post('read-all')
  async markAllAsRead(@GetUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  @Delete(':id')
  async deleteNotification(
    @GetUser() user: User,
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.deleteNotification(user.id, notificationId);
    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }

  @Post('settings')
  async updateNotificationSettings(
    @GetUser() user: User,
    @Body() settings: NotificationSettings,
  ) {
    await this.notificationsService.updateSettings(user.id, settings);
    return {
      success: true,
      message: 'Notification settings updated successfully',
    };
  }

  @Get('settings')
  async getNotificationSettings(@GetUser() user: User) {
    const settings = await this.notificationsService.getSettings(user.id);
    return {
      success: true,
      message: 'Notification settings retrieved successfully',
      data: settings,
    };
  }

  @Get('count')
  async getUnreadCount(@GetUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return {
      success: true,
      message: 'Unread count retrieved successfully',
      data: { count },
    };
  }
}
