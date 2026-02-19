import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService, CreateNotificationDto } from './notifications.service';
import { NotificationCategory } from './notification.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../users/user.entity';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my notifications' })
  @ApiQuery({ name: 'isRead', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMyNotifications(
    @CurrentUser() user: User,
    @Query('isRead') isRead?: string,
    @Query('category') category?: NotificationCategory,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findByUserId(user.id, {
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      category,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('unread-count')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get unread notifications count' })
  getUnreadCount(@CurrentUser() user: User) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Put(':id/read')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Put('read-all')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationsService.delete(id, user.id);
  }

  @Post('send')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a notification (admin only)' })
  sendNotification(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Post('send-bulk')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send bulk notifications (admin only)' })
  sendBulk(
    @Body('userIds') userIds: string[],
    @Body() dto: Omit<CreateNotificationDto, 'userId'>,
  ) {
    return this.notificationsService.sendBulk(userIds, dto);
  }
}
