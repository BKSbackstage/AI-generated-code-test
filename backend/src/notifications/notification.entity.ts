import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  TELEGRAM = 'telegram',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
}

export enum NotificationCategory {
  ORDER = 'order',
  TICKET = 'ticket',
  EVENT = 'event',
  PAYMENT = 'payment',
  SYSTEM = 'system',
  MARKETING = 'marketing',
  ARTIST = 'artist',
}

@Entity('notifications')
export class Notification {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  userId: string;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ enum: NotificationType })
  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.IN_APP })
  type: NotificationType;

  @ApiProperty({ enum: NotificationCategory })
  @Column({ type: 'enum', enum: NotificationCategory, default: NotificationCategory.SYSTEM })
  category: NotificationCategory;

  @ApiProperty({ enum: NotificationStatus })
  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @ApiProperty()
  @Column({ nullable: true })
  referenceId?: string;

  @ApiProperty()
  @Column({ nullable: true })
  referenceType?: string;

  @ApiProperty()
  @Column({ nullable: true })
  actionUrl?: string;

  @ApiProperty()
  @Column({ default: false })
  isRead: boolean;

  @ApiProperty()
  @Column({ nullable: true })
  readAt?: Date;

  @ApiProperty()
  @Column({ nullable: true })
  sentAt?: Date;

  @ApiProperty()
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
