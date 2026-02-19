import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist, ArtistStatus } from './artist.entity';

@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(Artist)
    private artistsRepository: Repository<Artist>,
  ) {}

  async create(userId: string, createDto: Partial<Artist>): Promise<Artist> {
    const existing = await this.artistsRepository.findOne({ where: { userId } });
    if (existing) {
      throw new ForbiddenException('Artist profile already exists for this user');
    }
    const artist = this.artistsRepository.create({ ...createDto, userId });
    return this.artistsRepository.save(artist);
  }

  async findAll(filters?: {
    genre?: string;
    status?: ArtistStatus;
    verified?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ artists: Artist[]; total: number }> {
    const { genre, status, verified, page = 1, limit = 20 } = filters || {};
    const query = this.artistsRepository.createQueryBuilder('artist');

    if (genre) query.andWhere('artist.genre = :genre', { genre });
    if (status) query.andWhere('artist.status = :status', { status });
    if (verified !== undefined) query.andWhere('artist.verified = :verified', { verified });

    query.skip((page - 1) * limit).take(limit);
    query.orderBy('artist.followersCount', 'DESC');

    const [artists, total] = await query.getManyAndCount();
    return { artists, total };
  }

  async findOne(id: string): Promise<Artist> {
    const artist = await this.artistsRepository.findOne({ where: { id } });
    if (!artist) throw new NotFoundException('Artist not found');
    return artist;
  }

  async findByUserId(userId: string): Promise<Artist> {
    const artist = await this.artistsRepository.findOne({ where: { userId } });
    if (!artist) throw new NotFoundException('Artist profile not found');
    return artist;
  }

  async update(id: string, userId: string, updateDto: Partial<Artist>): Promise<Artist> {
    const artist = await this.findOne(id);
    if (artist.userId !== userId) throw new ForbiddenException('Not your profile');
    Object.assign(artist, updateDto);
    return this.artistsRepository.save(artist);
  }

  async updateStatus(id: string, status: ArtistStatus): Promise<Artist> {
    const artist = await this.findOne(id);
    artist.status = status;
    return this.artistsRepository.save(artist);
  }

  async verify(id: string): Promise<Artist> {
    const artist = await this.findOne(id);
    artist.verified = true;
    artist.status = ArtistStatus.APPROVED;
    return this.artistsRepository.save(artist);
  }

  async delete(id: string, userId: string): Promise<void> {
    const artist = await this.findOne(id);
    if (artist.userId !== userId) throw new ForbiddenException('Not your profile');
    await this.artistsRepository.remove(artist);
  }

  async getRevenueStats(id: string): Promise<{ totalRevenue: number; followersCount: number }> {
    const artist = await this.findOne(id);
    return {
      totalRevenue: artist.totalRevenue,
      followersCount: artist.followersCount,
    };
  }

  async incrementFollowers(id: string): Promise<void> {
    await this.artistsRepository.increment({ id }, 'followersCount', 1);
  }

  async decrementFollowers(id: string): Promise<void> {
    await this.artistsRepository.decrement({ id }, 'followersCount', 1);
  }
}
