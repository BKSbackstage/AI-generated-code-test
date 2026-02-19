import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { Ticket, TicketStatus } from './ticket.entity';
import { User } from '../users/user.entity';
import { EventsService } from '../events/events.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
    @InjectQueue('tickets')
    private readonly ticketsQueue: Queue,
    private readonly eventsService: EventsService,
  ) {}

  async findByUser(userId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['event'],
    });
  }

  async findById(id: string, userId?: string): Promise<Ticket> {
    const where: any = { id };
    if (userId) where.userId = userId;
    const ticket = await this.ticketsRepository.findOne({
      where,
      relations: ['event', 'user'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async findByTicketNumber(ticketNumber: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { ticketNumber },
      relations: ['event', 'user'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async create(data: {
    userId: string;
    eventId: string;
    ticketType: string;
    price: number;
    serviceFee: number;
    orderId: string;
    attendeeName?: string;
    attendeeEmail?: string;
  }): Promise<Ticket> {
    const ticketNumber = this.generateTicketNumber();
    const qrData = JSON.stringify({
      ticketNumber,
      eventId: data.eventId,
      userId: data.userId,
      timestamp: Date.now(),
    });
    const qrCode = await QRCode.toDataURL(qrData);

    const ticket = this.ticketsRepository.create({
      ...data,
      ticketNumber,
      qrCode,
      status: TicketStatus.ACTIVE,
    });

    const saved = await this.ticketsRepository.save(ticket);
    await this.ticketsQueue.add('ticket-created', { ticketId: saved.id });
    return saved;
  }

  async checkIn(ticketId: string, staffId: string): Promise<Ticket> {
    const ticket = await this.findById(ticketId);
    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException(`Ticket cannot be checked in - status: ${ticket.status}`);
    }
    ticket.status = TicketStatus.USED;
    ticket.checkInAt = new Date();
    return this.ticketsRepository.save(ticket);
  }

  async cancel(ticketId: string, userId: string): Promise<Ticket> {
    const ticket = await this.findById(ticketId, userId);
    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('Only active tickets can be cancelled');
    }
    ticket.status = TicketStatus.CANCELLED;
    const saved = await this.ticketsRepository.save(ticket);
    await this.ticketsQueue.add('ticket-cancelled', { ticketId: saved.id });
    return saved;
  }

  async transfer(ticketId: string, fromUserId: string, toEmail: string): Promise<Ticket> {
    const ticket = await this.findById(ticketId, fromUserId);
    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException('Only active tickets can be transferred');
    }
    ticket.status = TicketStatus.TRANSFERRED;
    ticket.transferredToId = toEmail;
    const saved = await this.ticketsRepository.save(ticket);
    await this.ticketsQueue.add('ticket-transferred', { ticketId: saved.id, toEmail });
    return saved;
  }

  async getEventTickets(eventId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { eventId },
      relations: ['user'],
    });
  }

  async getStatistics(): Promise<any> {
    const total = await this.ticketsRepository.count();
    const active = await this.ticketsRepository.count({ where: { status: TicketStatus.ACTIVE } });
    const used = await this.ticketsRepository.count({ where: { status: TicketStatus.USED } });
    const cancelled = await this.ticketsRepository.count({ where: { status: TicketStatus.CANCELLED } });
    return { total, active, used, cancelled };
  }

  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `TKT-${timestamp}-${random}`;
  }
}
