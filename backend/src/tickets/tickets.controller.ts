import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TicketsService } from './tickets.service';
import { User, UserRole } from '../users/user.entity';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('my')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get my tickets' })
  getMyTickets(@CurrentUser() user: User) {
    return this.ticketsService.findByUser(user.id);
  }

  @Get(':id')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get ticket by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ticketsService.findById(id, user.id);
  }

  @Post(':id/cancel')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a ticket' })
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ticketsService.cancel(id, user.id);
  }

  @Post(':id/transfer')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer ticket to another user' })
  transfer(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('toEmail') toEmail: string,
  ) {
    return this.ticketsService.transfer(id, user.id, toEmail);
  }

  // Admin/Staff endpoints
  @Post(':id/check-in')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROMOTER)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check in a ticket (staff)' })
  checkIn(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ticketsService.checkIn(id, user.id);
  }

  @Get('event/:eventId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROMOTER)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get all tickets for an event (staff)' })
  getEventTickets(@Param('eventId') eventId: string) {
    return this.ticketsService.getEventTickets(eventId);
  }

  @Get('verify/:ticketNumber')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.PROMOTER)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Verify ticket by number (staff)' })
  verify(@Param('ticketNumber') ticketNumber: string) {
    return this.ticketsService.findByTicketNumber(ticketNumber);
  }
}
