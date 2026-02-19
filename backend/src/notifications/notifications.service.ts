import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationCategory,
} from './notification.entity';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  category?: NotificationCategory;
  referenceId?: string;
  referenceType?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      ...dto,
      type: dto.type || NotificationType.IN_APP,
      category: dto.category || NotificationCategory.SYSTEM,
      status: NotificationStatus.PENDING,
    });
    const saved = await this.notificationsRepository.save(notification);
    // Mark as sent for in-app notifications immediately
    if (saved.type === NotificationType.IN_APP) {
      saved.status = NotificationStatus.SENT;
      saved.sentAt = new Date();
      await this.notificationsRepository.save(saved);
    }
    return saved;
  }

  async findByUserId(
    userId: string,
    filters?: {
      isRead?: boolean;
      category?: NotificationCategory;
      page?: number;
      limit?: number;
    },
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const { isRead, category, page = 1, limit = 20 } = filters || {};
    const query = this.notificationsRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (isRead !== undefined) query.andWhere('notification.isRead = :isRead', { isRead });
    if (category) query.andWhere('notification.category = :category', { category });

    query.orderBy('notification.createdAt', 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [notifications, total] = await query.getManyAndCount();
    const unreadCount = await this.notificationsRepository.count({
      where: { userId, isRead: false },
    });

    return { notifications, total, unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = true;
    notification.readAt = new Date();
    notification.status = NotificationStatus.READ;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date(), status: NotificationStatus.READ })
      .where('userId = :userId AND isRead = false', { userId })
      .execute();
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.notificationsRepository.remove(notification);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, isRead: false },
    });
  }

  async sendBulk(userIds: string[], dto: Omit<CreateNotificationDto, 'userId'>): Promise<void> {
    const notifications = userIds.map((userId) =>
      this.notificationsRepository.create({
        ...dto,
        userId,
        type: dto.type || NotificationType.IN_APP,
        category: dto.category || NotificationCategory.SYSTEM,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      }),
    );
    await this.notificationsRepository.save(notifications);
  }
}
