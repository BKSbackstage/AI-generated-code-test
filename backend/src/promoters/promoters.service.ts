import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promoter, PromoterStatus } from './promoter.entity';

@Injectable()
export class PromotersService {
  constructor(
    @InjectRepository(Promoter)
    private promotersRepository: Repository<Promoter>,
  ) {}

  async create(userId: string, createDto: Partial<Promoter>): Promise<Promoter> {
    const existing = await this.promotersRepository.findOne({ where: { userId } });
    if (existing) {
      throw new ForbiddenException('Promoter profile already exists for this user');
    }
    const promoter = this.promotersRepository.create({ ...createDto, userId });
    return this.promotersRepository.save(promoter);
  }

  async findAll(filters?: {
    status?: PromoterStatus;
    verified?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ promoters: Promoter[]; total: number }> {
    const { status, verified, page = 1, limit = 20 } = filters || {};
    const query = this.promotersRepository.createQueryBuilder('promoter');

    if (status) query.andWhere('promoter.status = :status', { status });
    if (verified !== undefined) query.andWhere('promoter.verified = :verified', { verified });

    query.skip((page - 1) * limit).take(limit);
    query.orderBy('promoter.createdAt', 'DESC');

    const [promoters, total] = await query.getManyAndCount();
    return { promoters, total };
  }

  async findOne(id: string): Promise<Promoter> {
    const promoter = await this.promotersRepository.findOne({ where: { id } });
    if (!promoter) throw new NotFoundException('Promoter not found');
    return promoter;
  }

  async findByUserId(userId: string): Promise<Promoter> {
    const promoter = await this.promotersRepository.findOne({ where: { userId } });
    if (!promoter) throw new NotFoundException('Promoter profile not found');
    return promoter;
  }

  async update(
    id: string,
    userId: string,
    updateDto: Partial<Promoter>,
  ): Promise<Promoter> {
    const promoter = await this.findOne(id);
    if (promoter.userId !== userId) throw new ForbiddenException('Not your profile');
    Object.assign(promoter, updateDto);
    return this.promotersRepository.save(promoter);
  }

  async updateStatus(id: string, status: PromoterStatus): Promise<Promoter> {
    const promoter = await this.findOne(id);
    promoter.status = status;
    return this.promotersRepository.save(promoter);
  }

  async approve(id: string): Promise<Promoter> {
    const promoter = await this.findOne(id);
    promoter.status = PromoterStatus.APPROVED;
    promoter.verified = true;
    return this.promotersRepository.save(promoter);
  }

  async setCommissionRate(id: string, rate: number): Promise<Promoter> {
    const promoter = await this.findOne(id);
    promoter.commissionRate = rate;
    return this.promotersRepository.save(promoter);
  }

  async getPayoutInfo(id: string): Promise<{
    totalRevenue: number;
    pendingPayout: number;
    commissionRate: number;
  }> {
    const promoter = await this.findOne(id);
    return {
      totalRevenue: promoter.totalRevenue,
      pendingPayout: promoter.pendingPayout,
      commissionRate: promoter.commissionRate,
    };
  }

  async processPayout(id: string): Promise<Promoter> {
    const promoter = await this.findOne(id);
    promoter.pendingPayout = 0;
    return this.promotersRepository.save(promoter);
  }

  async delete(id: string): Promise<void> {
    const promoter = await this.findOne(id);
    await this.promotersRepository.remove(promoter);
  }
}
