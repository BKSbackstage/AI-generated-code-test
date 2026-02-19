import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { Ticket } from '../tickets/ticket.entity';
import { Artist } from '../artists/artist.entity';
import { Promoter } from '../promoters/promoter.entity';

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  POSTPONED = 'postponed',
}

export enum EventCategory {
  MUSIC = 'music',
  FESTIVAL = 'festival',
  CLUB = 'club',
  CONCERT = 'concert',
  CONFERENCE = 'conference',
  SPORTS = 'sports',
  ART = 'art',
  COMEDY = 'comedy',
  THEATER = 'theater',
  OTHER = 'other',
}

@Entity('events')
@Index(['status', 'startDate'])
@Index(['category', 'status'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column({ length: 255 })
  @ApiProperty()
  title: string;

  @Column('text')
  @ApiProperty()
  description: string;

  @Column('text', { nullable: true })
  @ApiProperty()
  shortDescription: string;

  @Column({
    type: 'enum',
    enum: EventCategory,
    default: EventCategory.MUSIC,
  })
  @ApiProperty({ enum: EventCategory })
  category: EventCategory;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  // Location
  @Column({ length: 255 })
  @ApiProperty()
  venue: string;

  @Column({ length: 255 })
  @ApiProperty()
  address: string;

  @Column({ length: 100 })
  @ApiProperty()
  city: string;

  @Column({ length: 100 })
  @ApiProperty()
  country: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  @ApiProperty()
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  @ApiProperty()
  longitude: number;

  // Dates
  @Column('timestamptz')
  @ApiProperty()
  startDate: Date;

  @Column('timestamptz')
  @ApiProperty()
  endDate: Date;

  @Column('timestamptz', { nullable: true })
  @ApiProperty()
  doorsOpen: Date;

  // Media
  @Column({ nullable: true })
  @ApiProperty()
  coverImage: string;

  @Column('simple-array', { nullable: true })
  @ApiProperty()
  gallery: string[];

  @Column({ nullable: true })
  @ApiProperty()
  videoUrl: string;

  // Capacity
  @Column({ type: 'int', default: 0 })
  @ApiProperty()
  totalCapacity: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty()
  ticketsSold: number;

  // Ticket Tiers (stored as JSON)
  @Column('jsonb', { nullable: true })
  @ApiProperty()
  ticketTiers: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    quantity: number;
    sold: number;
    maxPerOrder: number;
    saleStart: Date;
    saleEnd: Date;
    isActive: boolean;
    perks: string[];
  }>;

  // Pricing
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @ApiProperty()
  minPrice: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @ApiProperty()
  maxPrice: number;

  @Column({ length: 3, default: 'EUR' })
  @ApiProperty()
  currency: string;

  // NFT Ticketing
  @Column({ default: false })
  @ApiProperty()
  nftEnabled: boolean;

  @Column({ nullable: true })
  @ApiProperty()
  nftContractAddress: string;

  @Column({ nullable: true })
  @ApiProperty()
  nftChain: string; // 'bsc' | 'near'

  // Promo Codes
  @Column('jsonb', { nullable: true })
  @ApiProperty()
  promoCodes: Array<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxUses: number;
    usedCount: number;
    validUntil: Date;
  }>;

  // Relations
  @ManyToOne(() => Promoter, (promoter) => promoter.events)
  @JoinColumn({ name: 'promoterId' })
  promoter: Promoter;

  @Column('uuid')
  promoterId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column('uuid', { nullable: true })
  createdById: string;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];

  @Column('simple-array', { nullable: true })
  artistIds: string[];

  // Meta
  @Column('jsonb', { nullable: true })
  @ApiProperty()
  tags: string[];

  @Column({ default: false })
  @ApiProperty()
  isFeatured: boolean;

  @Column({ default: false })
  @ApiProperty()
  isPrivate: boolean;

  @Column({ nullable: true })
  @ApiProperty()
  ageRestriction: number;

  @Column({ default: 0 })
  @ApiProperty()
  viewCount: number;

  @Column({ default: 0 })
  @ApiProperty()
  likeCount: number;

  @Column('jsonb', { nullable: true })
  @ApiProperty()
  seoMeta: {
    title: string;
    description: string;
    keywords: string[];
  };

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}
