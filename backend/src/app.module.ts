import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { TicketsModule } from './tickets/tickets.module';
import { PaymentsModule } from './payments/payments.module';
import { ArtistsModule } from './artists/artists.module';
import { PromotersModule } from './promoters/promoters.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { AdminModule } from './admin/admin.module';
import { StorageModule } from './storage/storage.module';
import { RewardsModule } from './rewards/rewards.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'backstage_global'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),

    // Queue (Redis/Bull)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // Cron Jobs
    ScheduleModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),

    // Feature Modules
    AuthModule,
    UsersModule,
    EventsModule,
    TicketsModule,
    PaymentsModule,
    ArtistsModule,
    PromotersModule,
    NotificationsModule,
    MarketplaceModule,
    AdminModule,
    StorageModule,
    RewardsModule,
    WebsocketModule,
  ],
})
export class AppModule {}
