import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum ArtistStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
}

@Entity('artists')
export class Artist {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  userId: string;

  @ApiProperty()
  @Column()
  stageName: string;

  @ApiProperty()
  @Column({ nullable: true })
  bio?: string;

  @ApiProperty()
  @Column({ nullable: true })
  genre?: string;

  @ApiProperty()
  @Column({ nullable: true })
  profileImage?: string;

  @ApiProperty()
  @Column({ nullable: true })
  coverImage?: string;

  @ApiProperty()
  @Column({ nullable: true })
  website?: string;

  @ApiProperty()
  @Column({ nullable: true })
  instagram?: string;

  @ApiProperty()
  @Column({ nullable: true })
  twitter?: string;

  @ApiProperty()
  @Column({ nullable: true })
  spotify?: string;

  @ApiProperty()
  @Column({ nullable: true })
  soundcloud?: string;

  @ApiProperty()
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @ApiProperty()
  @Column({ type: 'simple-array', nullable: true })
  mediaGallery?: string[];

  @ApiProperty({ enum: ArtistStatus })
  @Column({ type: 'enum', enum: ArtistStatus, default: ArtistStatus.PENDING })
  status: ArtistStatus;

  @ApiProperty()
  @Column({ default: false })
  verified: boolean;

  @ApiProperty()
  @Column({ default: 0 })
  followersCount: number;

  @ApiProperty()
  @Column({ nullable: true })
  country?: string;

  @ApiProperty()
  @Column({ nullable: true })
  city?: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRevenue: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
