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
import { ArtistsService } from './artists.service';
import { Artist, ArtistStatus } from './artist.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/user.entity';

@ApiTags('artists')
@Controller('artists')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all artists' })
  @ApiQuery({ name: 'genre', required: false })
  @ApiQuery({ name: 'verified', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('genre') genre?: string,
    @Query('verified') verified?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.artistsService.findAll({
      genre,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get artist by ID' })
  findOne(@Param('id') id: string) {
    return this.artistsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create artist profile' })
  create(@Body() createDto: Partial<Artist>, @CurrentUser() user: User) {
    return this.artistsService.create(user.id, createDto);
  }

  @Put(':id')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update artist profile' })
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<Artist>,
    @CurrentUser() user: User,
  ) {
    return this.artistsService.update(id, user.id, updateDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete artist profile' })
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.artistsService.delete(id, user.id);
  }

  @Get(':id/revenue')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get artist revenue stats' })
  getRevenue(@Param('id') id: string) {
    return this.artistsService.getRevenueStats(id);
  }

  @Put(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify artist (admin only)' })
  verify(@Param('id') id: string) {
    return this.artistsService.verify(id);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update artist status (admin only)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ArtistStatus,
  ) {
    return this.artistsService.updateStatus(id, status);
  }

  @Post(':id/follow')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow an artist' })
  follow(@Param('id') id: string) {
    return this.artistsService.incrementFollowers(id);
  }

  @Post(':id/unfollow')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow an artist' })
  unfollow(@Param('id') id: string) {
    return this.artistsService.decrementFollowers(id);
  }
}
