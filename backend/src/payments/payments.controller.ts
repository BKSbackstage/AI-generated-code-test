import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PaymentsService } from './payments.service';
import { User, UserRole } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create an order and get Stripe client secret' })
  createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.createOrder(createOrderDto, user);
  }

  @Get('orders')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get my orders' })
  getMyOrders(@CurrentUser() user: User) {
    return this.paymentsService.getOrdersByUser(user.id);
  }

  @Get('orders/:id')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get order by ID' })
  getOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paymentsService.getOrderById(id, user.id);
  }

  @Post('orders/:id/refund')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request refund for an order' })
  requestRefund(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paymentsService.requestRefund(id, user.id);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }

  @Get('revenue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get revenue statistics (admin)' })
  getRevenue() {
    return this.paymentsService.getRevenueStatistics();
  }
}
