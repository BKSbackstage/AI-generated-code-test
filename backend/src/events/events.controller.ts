import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param,
  Query, UseGuards, Request, UploadedFiles, UseInterceptors,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventFilterDto } from './dto/event-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ============ PUBLIC ENDPOINTS ============

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all published events with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  findAll(@Query() filterDto: EventFilterDto) {
    return this.eventsService.findAll(filterDto);
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured events' })
  getFeatured() {
    return this.eventsService.getFeatured();
  }

  @Get('trending')
  @Public()
  @ApiOperation({ summary: 'Get trending events' })
  getTrending() {
    return this.eventsService.getTrending();
  }

  @Get('nearby')
  @Public()
  @ApiOperation({ summary: 'Get events near a location' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  getNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 50,
  ) {
    return this.eventsService.getNearby(lat, lng, radius);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get event by ID' })
  findOne(@Param('id') id: string, @Request() req?: any) {
    const userId = req?.user?.id;
    return this.eventsService.findOne(id, userId);
  }

  @Get(':id/tickets-availability')
  @Public()
  @ApiOperation({ summary: 'Get ticket availability for an event' })
  getTicketAvailability(@Param('id') id: string) {
    return this.eventsService.getTicketAvailability(id);
  }

  // ============ AUTHENTICATED ENDPOINTS ============

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Like/unlike an event' })
  toggleLike(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.toggleLike(id, req.user.id);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Increment view count' })
  incrementView(@Param('id') id: string) {
    return this.eventsService.incrementView(id);
  }

  // ============ PROMOTER ENDPOINTS ============

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROMOTER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new event (promoter)' })
  @UseInterceptors(FilesInterceptor('images', 10))
  create(
    @Body() createEventDto: CreateEventDto,
    @Request() req: any,
    @UploadedFiles() images?: Express.Multer.File[],
  ) {
    return this.eventsService.create(createEventDto, req.user, images);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROMOTER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update event (promoter)' })
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: any,
  ) {
    return this.eventsService.update(id, updateEventDto, req.user);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROMOTER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Publish an event' })
  publish(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.publish(id, req.user);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROMOTER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Cancel an event' })
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.cancel(id, req.user);
  }

  @Post(':id/promo-code/validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Validate a promo code for an event' })
  validatePromoCode(
    @Param('id') id: string,
    @Body('code') code: string,
  ) {
    return this.eventsService.validatePromoCode(id, code);
  }

  // ============ ADMIN ENDPOINTS ============

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get all events including drafts (admin)' })
  findAllAdmin(@Query() filterDto: EventFilterDto) {
    return this.eventsService.findAllAdmin(filterDto);
  }

  @Patch(':id/feature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Feature/unfeature an event (admin)' })
  toggleFeature(@Param('id') id: string) {
    return this.eventsService.toggleFeature(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event (admin only)' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
