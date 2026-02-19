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
import { PromotersService } from './promoters.service';
import { Promoter, PromoterStatus } from './promoter.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../users/user.entity';

@ApiTags('promoters')
@Controller('promoters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromotersController {
  constructor(private readonly promotersService: PromotersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all promoters (admin only)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'verified', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('status') status?: PromoterStatus,
    @Query('verified') verified?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.promotersService.findAll({
      status,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('me')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get my promoter profile' })
  getMyProfile(@CurrentUser() user: User) {
    return this.promotersService.findByUserId(user.id);
  }

  @Get(':id')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get promoter by ID' })
  findOne(@Param('id') id: string) {
    return this.promotersService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create promoter profile' })
  create(@Body() createDto: Partial<Promoter>, @CurrentUser() user: User) {
    return this.promotersService.create(user.id, createDto);
  }

  @Put(':id')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update promoter profile' })
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<Promoter>,
    @CurrentUser() user: User,
  ) {
    return this.promotersService.update(id, user.id, updateDto);
  }

  @Put(':id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve promoter (admin only)' })
  approve(@Param('id') id: string) {
    return this.promotersService.approve(id);
  }

  @Put(':id/commission')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set commission rate (admin only)' })
  setCommission(
    @Param('id') id: string,
    @Body('rate') rate: number,
  ) {
    return this.promotersService.setCommissionRate(id, rate);
  }

  @Get(':id/payout')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payout info' })
  getPayoutInfo(@Param('id') id: string) {
    return this.promotersService.getPayoutInfo(id);
  }

  @Post(':id/payout')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process payout (admin only)' })
  processPayout(@Param('id') id: string) {
    return this.promotersService.processPayout(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete promoter (admin only)' })
  delete(@Param('id') id: string) {
    return this.promotersService.delete(id);
  }
}
