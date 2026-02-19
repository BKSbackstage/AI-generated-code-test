import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  USER = 'user',
  PROMOTER = 'promoter',
  SUPER_ADMIN = 'super_admin',
}

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  @Column({ unique: true })
  @Index()
  email: string;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty({ example: 'John' })
  @Column()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Column()
  lastName: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  avatar?: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  phone?: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  bio?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.USER })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isEmailVerified: boolean;

  @Exclude()
  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Exclude()
  @Column({ nullable: true })
  passwordResetToken?: string;

  @Exclude()
  @Column({ nullable: true, type: 'timestamp' })
  passwordResetExpiry?: Date;

  @Exclude()
  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ nullable: true })
  googleId?: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  stripeCustomerId?: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  organizationName?: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  organizationWebsite?: string;

  @ApiPropertyOptional()
  @Column({ default: false })
  isPromoterVerified: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
