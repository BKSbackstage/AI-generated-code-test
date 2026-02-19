import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum ListingType {
  NFT_TICKET = 'nft_ticket',
  PHYSICAL_TICKET = 'physical_ticket',
  COLLECTIBLE = 'collectible',
}

@Entity('marketplace_listings')
export class MarketplaceListing {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  sellerId: string;

  @ApiProperty()
  @Column({ nullable: true })
  buyerId?: string;

  @ApiProperty()
  @Column()
  ticketId: string;

  @ApiProperty()
  @Column({ nullable: true })
  eventId?: string;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  askingPrice: number;

  @ApiProperty()
  @Column({ default: 'USD' })
  currency: string;

  @ApiProperty({ enum: ListingType })
  @Column({ type: 'enum', enum: ListingType, default: ListingType.PHYSICAL_TICKET })
  listingType: ListingType;

  @ApiProperty({ enum: ListingStatus })
  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.ACTIVE })
  status: ListingStatus;

  @ApiProperty()
  @Column({ nullable: true })
  tokenId?: string;

  @ApiProperty()
  @Column({ nullable: true })
  contractAddress?: string;

  @ApiProperty()
  @Column({ nullable: true })
  blockchain?: string;

  @ApiProperty()
  @Column({ nullable: true })
  imageUrl?: string;

  @ApiProperty()
  @Column({ nullable: true })
  expiresAt?: Date;

  @ApiProperty()
  @Column({ nullable: true })
  soldAt?: Date;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  finalPrice?: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  platformFeePercent: number;

  @ApiProperty()
  @Column({ default: 0 })
  viewCount: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
