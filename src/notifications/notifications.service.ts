import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationSettings } from './dto/notification-settings.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getNotifications(userId: string, skip: number, limit: number) {
    const [notifications, total] = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      notifications,
      pagination: {
        total,
        page: Math.floor(skip / limit) + 1,
        limit,
        hasMore: total > skip + limit,
      },
    };
  }

  async getUnreadNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true },
    );
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async updateSettings(userId: string, settings: NotificationSettings) {
    // Implement based on notification settings storage strategy
  }

  async getSettings(userId: string): Promise<NotificationSettings> {
    return {
      likes: true,
      comments: true,
      mentions: true,
      messages: true,
      follows: true,
    };
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    route?: string,
  ) {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      data,
      route,
    });

    await this.notificationRepository.save(notification);

    // Emit event for real-time updates
    this.eventEmitter.emit('notification.created', {
      userId,
      notification,
    });

    return notification;
  }
}
