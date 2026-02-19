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
import { MarketplaceService } from './marketplace.service';
import { MarketplaceListing, ListingStatus, ListingType } from './marketplace-listing.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../users/user.entity';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('marketplace')
@Controller('marketplace')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all marketplace listings' })
  @ApiQuery({ name: 'listingType', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('listingType') listingType?: ListingType,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('eventId') eventId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.findAll({
      listingType,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      eventId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Public()
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get marketplace statistics' })
  getStats() {
    return this.marketplaceService.getStats();
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get listing by ID' })
  findOne(@Param('id') id: string) {
    return this.marketplaceService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new listing' })
  createListing(
    @Body() createDto: Partial<MarketplaceListing>,
    @CurrentUser() user: User,
  ) {
    return this.marketplaceService.createListing(user.id, createDto);
  }

  @Put(':id')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a listing' })
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<MarketplaceListing>,
    @CurrentUser() user: User,
  ) {
    return this.marketplaceService.update(id, user.id, updateDto);
  }

  @Post(':id/purchase')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Purchase a listing' })
  purchase(
    @Param('id') id: string,
    @Body('finalPrice') finalPrice: number,
    @CurrentUser() user: User,
  ) {
    return this.marketplaceService.purchase(id, user.id, finalPrice);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a listing' })
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.marketplaceService.cancel(id, user.id);
  }
}
