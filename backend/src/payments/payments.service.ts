import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Order, OrderStatus } from './order.entity';
import { TicketsService } from '../tickets/tickets.service';
import { EventsService } from '../events/events.service';
import { UsersService } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly SERVICE_FEE_PERCENT = 0.05; // 5% service fee

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly configService: ConfigService,
    private readonly ticketsService: TicketsService,
    private readonly eventsService: EventsService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async createOrder(createOrderDto: CreateOrderDto, user: User): Promise<{ order: Order; clientSecret: string }> {
    const event = await this.eventsService.findOne(createOrderDto.eventId);

    const ticketType = event.ticketTypes?.find(
      (t) => t.name === createOrderDto.ticketType,
    );
    if (!ticketType) throw new BadRequestException('Invalid ticket type');

    const quantity = createOrderDto.quantity || 1;
    const subtotal = ticketType.price * quantity;
    const serviceFee = subtotal * this.SERVICE_FEE_PERCENT;
    const total = subtotal + serviceFee;

    // Create Stripe PaymentIntent
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.fullName,
      });
      stripeCustomerId = customer.id;
      await this.usersService.update(user.id, { stripeCustomerId });
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Stripe uses cents
      currency: 'usd',
      customer: stripeCustomerId,
      metadata: {
        userId: user.id,
        eventId: event.id,
        ticketType: createOrderDto.ticketType,
        quantity: String(quantity),
      },
    });

    const order = this.ordersRepository.create({
      userId: user.id,
      eventId: event.id,
      ticketType: createOrderDto.ticketType,
      quantity,
      unitPrice: ticketType.price,
      serviceFee,
      total,
      status: OrderStatus.PENDING,
      stripePaymentIntentId: paymentIntent.id,
    });

    const savedOrder = await this.ordersRepository.save(order);
    return { order: savedOrder, clientSecret: paymentIntent.client_secret };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.configService.get('STRIPE_WEBHOOK_SECRET'),
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const order = await this.ordersRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });
    if (!order) return;

    order.status = OrderStatus.COMPLETED;
    await this.ordersRepository.save(order);

    // Create tickets
    const { userId, eventId, ticketType, quantity, unitPrice, serviceFee } = order;
    const ticketPromises = Array.from({ length: quantity }).map(() =>
      this.ticketsService.create({
        userId,
        eventId,
        ticketType,
        price: unitPrice,
        serviceFee: serviceFee / quantity,
        orderId: order.id,
      }),
    );
    const tickets = await Promise.all(ticketPromises);

    // Send confirmation email
    const user = await this.usersService.findById(userId);
    if (user) {
      await this.mailService.sendOrderConfirmation(user.email, order, tickets);
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const order = await this.ordersRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });
    if (!order) return;
    order.status = OrderStatus.FAILED;
    await this.ordersRepository.save(order);
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getOrderById(id: string, userId: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({ where: { id, userId } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async requestRefund(orderId: string, userId: string): Promise<Order> {
    const order = await this.getOrderById(orderId, userId);
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Only completed orders can be refunded');
    }

    await this.stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
    });

    order.status = OrderStatus.REFUNDED;
    return this.ordersRepository.save(order);
  }

  async getRevenueStatistics(): Promise<any> {
    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'totalRevenue')
      .addSelect('COUNT(*)', 'totalOrders')
      .where('order.status = :status', { status: OrderStatus.COMPLETED })
      .getRawOne();
    return result;
  }
}
