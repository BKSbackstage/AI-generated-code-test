import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';

export interface PlatformStats {
  totalUsers: number;
  totalArtists: number;
  totalPromoters: number;
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  activeListings: number;
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  platformCommission: number;
  promoterPayouts: number;
  refunds: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getPlatformStats(): Promise<PlatformStats> {
    const totalUsers = await this.usersRepository.count();
    const totalArtists = await this.usersRepository.count({
      where: { role: UserRole.ARTIST },
    });
    const totalPromoters = await this.usersRepository.count({
      where: { role: UserRole.PROMOTER },
    });

    return {
      totalUsers,
      totalArtists,
      totalPromoters,
      totalEvents: 0,
      totalTicketsSold: 0,
      totalRevenue: 0,
      activeListings: 0,
    };
  }

  async getAllUsers(filters?: {
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    const { role, isActive, page = 1, limit = 20 } = filters || {};
    const query = this.usersRepository.createQueryBuilder('user');

    if (role) query.andWhere('user.role = :role', { role });
    if (isActive !== undefined) query.andWhere('user.isActive = :isActive', { isActive });

    query.orderBy('user.createdAt', 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [users, total] = await query.getManyAndCount();
    return { users, total };
  }

  async suspendUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    user.isActive = false;
    return this.usersRepository.save(user);
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    user.isActive = true;
    return this.usersRepository.save(user);
  }

  async changeUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    user.role = role;
    return this.usersRepository.save(user);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.usersRepository.delete(userId);
  }

  async getRevenueReport(startDate: Date, endDate: Date): Promise<RevenueReport> {
    return {
      period: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      totalRevenue: 0,
      platformCommission: 0,
      promoterPayouts: 0,
      refunds: 0,
    };
  }

  async getSystemHealth(): Promise<{
    status: string;
    timestamp: string;
    services: Record<string, string>;
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        storage: 'connected',
      },
    };
  }
}
