import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Event, EventStatus } from './event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventFilterDto } from './dto/event-filter.dto';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user.entity';
import { StorageService } from '../storage/storage.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectQueue('events')
    private readonly eventsQueue: Queue,
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
    private readonly searchService: SearchService,
  ) {}

  async findAll(filterDto: EventFilterDto): Promise<{ data: Event[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, category, city, dateFrom, dateTo, search, featured } = filterDto;

    const query = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.ticketTypes', 'ticketTypes')
      .where('event.status = :status', { status: EventStatus.PUBLISHED })
      .andWhere('event.date >= :now', { now: new Date() });

    if (category) query.andWhere('event.category = :category', { category });
    if (city) query.andWhere('LOWER(event.city) LIKE LOWER(:city)', { city: `%${city}%` });
    if (dateFrom) query.andWhere('event.date >= :dateFrom', { dateFrom });
    if (dateTo) query.andWhere('event.date <= :dateTo', { dateTo });
    if (search) {
      query.andWhere(
        '(LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }
    if (featured !== undefined) query.andWhere('event.featured = :featured', { featured });

    query
      .orderBy('event.featured', 'DESC')
      .addOrderBy('event.date', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async findAllAdmin(filterDto: EventFilterDto): Promise<{ data: Event[]; total: number }> {
    const { page = 1, limit = 20, status, search } = filterDto;

    const query = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .orderBy('event.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) query.where('event.status = :status', { status });
    if (search) {
      query.andWhere(
        '(LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['organizer', 'ticketTypes', 'reviews'],
    });
    if (!event) throw new NotFoundException(`Event #${id} not found`);
    // Increment view count
    await this.eventsRepository.increment({ id }, 'viewCount', 1);
    return event;
  }

  async findBySlug(slug: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { slug, status: EventStatus.PUBLISHED },
      relations: ['organizer', 'ticketTypes'],
    });
    if (!event) throw new NotFoundException(`Event not found`);
    await this.eventsRepository.increment({ id: event.id }, 'viewCount', 1);
    return event;
  }

  async create(createEventDto: CreateEventDto, organizer: User): Promise<Event> {
    const slug = await this.generateSlug(createEventDto.title);
    const event = this.eventsRepository.create({
      ...createEventDto,
      slug,
      organizer,
      status: EventStatus.DRAFT,
    });
    const saved = await this.eventsRepository.save(event);
    await this.eventsQueue.add('event-created', { eventId: saved.id });
    return saved;
  }

  async update(id: string, updateEventDto: UpdateEventDto, user: User): Promise<Event> {
    const event = await this.findOne(id);
    if (event.organizer.id !== user.id && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to update this event');
    }
    Object.assign(event, updateEventDto);
    return this.eventsRepository.save(event);
  }

  async submitForReview(id: string, user: User): Promise<Event> {
    const event = await this.findOne(id);
    if (event.organizer.id !== user.id) {
      throw new ForbiddenException('Only the organizer can submit for review');
    }
    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException('Only draft events can be submitted for review');
    }
    event.status = EventStatus.PENDING_REVIEW;
    return this.eventsRepository.save(event);
  }

  async approve(id: string): Promise<Event> {
    const event = await this.findOne(id);
    event.status = EventStatus.PUBLISHED;
    const saved = await this.eventsRepository.save(event);
    await this.eventsQueue.add('event-published', { eventId: saved.id });
    await this.searchService.indexEvent(saved);
    return saved;
  }

  async reject(id: string, reason: string): Promise<Event> {
    const event = await this.findOne(id);
    event.status = EventStatus.REJECTED;
    (event as any).rejectionReason = reason;
    return this.eventsRepository.save(event);
  }

  async toggleFeature(id: string): Promise<Event> {
    const event = await this.findOne(id);
    event.featured = !event.featured;
    return this.eventsRepository.save(event);
  }

  async uploadBanner(id: string, file: Express.Multer.File, user: User): Promise<Event> {
    const event = await this.findOne(id);
    if (event.organizer.id !== user.id && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Permission denied');
    }
    const url = await this.storageService.uploadFile(file, `events/${id}/banner`);
    event.bannerImage = url;
    return this.eventsRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventsRepository.remove(event);
    await this.searchService.removeEvent(id);
  }

  async getFeatured(): Promise<Event[]> {
    return this.eventsRepository.find({
      where: { featured: true, status: EventStatus.PUBLISHED },
      order: { date: 'ASC' },
      take: 10,
      relations: ['organizer'],
    });
  }

  async getUpcoming(): Promise<Event[]> {
    return this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .where('event.status = :status', { status: EventStatus.PUBLISHED })
      .andWhere('event.date >= :now', { now: new Date() })
      .orderBy('event.date', 'ASC')
      .take(12)
      .getMany();
  }

  async getStatistics(): Promise<any> {
    const total = await this.eventsRepository.count();
    const published = await this.eventsRepository.count({ where: { status: EventStatus.PUBLISHED } });
    const pending = await this.eventsRepository.count({ where: { status: EventStatus.PENDING_REVIEW } });
    const draft = await this.eventsRepository.count({ where: { status: EventStatus.DRAFT } });
    const featured = await this.eventsRepository.count({ where: { featured: true } });
    return { total, published, pending, draft, featured };
  }

  private async generateSlug(title: string): Promise<string> {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let slug = base;
    let count = 1;
    while (await this.eventsRepository.findOne({ where: { slug } })) {
      slug = `${base}-${count++}`;
    }
    return slug;
  }
}
