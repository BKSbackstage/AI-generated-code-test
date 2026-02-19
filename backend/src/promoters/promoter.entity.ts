import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum PromoterStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

@Entity('promoters')
export class Promoter {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  userId: string;

  @ApiProperty()
  @Column()
  companyName: string;

  @ApiProperty()
  @Column({ nullable: true })
  contactName?: string;

  @ApiProperty()
  @Column({ nullable: true })
  bio?: string;

  @ApiProperty()
  @Column({ nullable: true })
  logo?: string;

  @ApiProperty()
  @Column({ nullable: true })
  website?: string;

  @ApiProperty()
  @Column({ nullable: true })
  phone?: string;

  @ApiProperty()
  @Column({ nullable: true })
  address?: string;

  @ApiProperty()
  @Column({ nullable: true })
  city?: string;

  @ApiProperty()
  @Column({ nullable: true })
  country?: string;

  @ApiProperty()
  @Column({ nullable: true })
  vatNumber?: string;

  @ApiProperty()
  @Column({ nullable: true })
  bankAccountIban?: string;

  @ApiProperty()
  @Column({ nullable: true })
  stripeAccountId?: string;

  @ApiProperty({ enum: PromoterStatus })
  @Column({
    type: 'enum',
    enum: PromoterStatus,
    default: PromoterStatus.PENDING,
  })
  status: PromoterStatus;

  @ApiProperty()
  @Column({ default: false })
  verified: boolean;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  commissionRate: number;

  @ApiProperty()
  @Column({ default: 0 })
  totalEventsCreated: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRevenue: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingPayout: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
