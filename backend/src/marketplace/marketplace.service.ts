import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MarketplaceListing,
  ListingStatus,
  ListingType,
} from './marketplace-listing.entity';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(MarketplaceListing)
    private listingsRepository: Repository<MarketplaceListing>,
  ) {}

  async createListing(
    sellerId: string,
    createDto: Partial<MarketplaceListing>,
  ): Promise<MarketplaceListing> {
    const listing = this.listingsRepository.create({
      ...createDto,
      sellerId,
      status: ListingStatus.ACTIVE,
    });
    return this.listingsRepository.save(listing);
  }

  async findAll(filters?: {
    listingType?: ListingType;
    status?: ListingStatus;
    minPrice?: number;
    maxPrice?: number;
    sellerId?: string;
    eventId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ listings: MarketplaceListing[]; total: number }> {
    const {
      listingType,
      status = ListingStatus.ACTIVE,
      minPrice,
      maxPrice,
      sellerId,
      eventId,
      page = 1,
      limit = 20,
    } = filters || {};

    const query = this.listingsRepository.createQueryBuilder('listing');
    query.andWhere('listing.status = :status', { status });

    if (listingType) query.andWhere('listing.listingType = :listingType', { listingType });
    if (sellerId) query.andWhere('listing.sellerId = :sellerId', { sellerId });
    if (eventId) query.andWhere('listing.eventId = :eventId', { eventId });
    if (minPrice) query.andWhere('listing.askingPrice >= :minPrice', { minPrice });
    if (maxPrice) query.andWhere('listing.askingPrice <= :maxPrice', { maxPrice });

    query.orderBy('listing.createdAt', 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [listings, total] = await query.getManyAndCount();
    return { listings, total };
  }

  async findOne(id: string): Promise<MarketplaceListing> {
    const listing = await this.listingsRepository.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    await this.listingsRepository.increment({ id }, 'viewCount', 1);
    return listing;
  }

  async update(
    id: string,
    sellerId: string,
    updateDto: Partial<MarketplaceListing>,
  ): Promise<MarketplaceListing> {
    const listing = await this.findOne(id);
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Not your listing');
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Cannot edit an inactive listing');
    }
    Object.assign(listing, updateDto);
    return this.listingsRepository.save(listing);
  }

  async purchase(
    id: string,
    buyerId: string,
    finalPrice?: number,
  ): Promise<MarketplaceListing> {
    const listing = await this.listingsRepository.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Listing is not available for purchase');
    }
    if (listing.sellerId === buyerId) {
      throw new ForbiddenException('Cannot purchase your own listing');
    }
    listing.buyerId = buyerId;
    listing.status = ListingStatus.SOLD;
    listing.soldAt = new Date();
    listing.finalPrice = finalPrice ?? listing.askingPrice;
    return this.listingsRepository.save(listing);
  }

  async cancel(id: string, sellerId: string): Promise<MarketplaceListing> {
    const listing = await this.listingsRepository.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Not your listing');
    listing.status = ListingStatus.CANCELLED;
    return this.listingsRepository.save(listing);
  }

  async getStats(): Promise<{
    totalListings: number;
    totalSold: number;
    totalVolume: number;
  }> {
    const totalListings = await this.listingsRepository.count();
    const soldListings = await this.listingsRepository.find({
      where: { status: ListingStatus.SOLD },
    });
    const totalSold = soldListings.length;
    const totalVolume = soldListings.reduce(
      (sum, l) => sum + Number(l.finalPrice || 0),
      0,
    );
    return { totalListings, totalSold, totalVolume };
  }
}
