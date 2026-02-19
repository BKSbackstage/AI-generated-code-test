import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { Event } from '../events/event.entity';

export enum TicketStatus {
  ACTIVE = 'active',
  USED = 'used',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  TRANSFERRED = 'transferred',
}

@Entity('tickets')
export class Ticket {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  @Index()
  ticketNumber: string;

  @ApiProperty()
  @Column()
  qrCode: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Event, { eager: true })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  eventId: string;

  @ApiProperty({ example: 'General Admission' })
  @Column()
  ticketType: string;

  @ApiProperty({ example: 49.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  serviceFee: number;

  @ApiProperty({ enum: TicketStatus, default: TicketStatus.ACTIVE })
  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.ACTIVE })
  status: TicketStatus;

  @ApiProperty()
  @Column({ nullable: true })
  orderId?: string;

  @ApiProperty()
  @Column({ nullable: true })
  attendeeName?: string;

  @ApiProperty()
  @Column({ nullable: true })
  attendeeEmail?: string;

  @ApiProperty()
  @Column({ nullable: true })
  seatNumber?: string;

  @Column({ nullable: true })
  checkInAt?: Date;

  @ApiProperty()
  @Column({ nullable: true })
  transferredToId?: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
