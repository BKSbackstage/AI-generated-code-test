import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { MulterModule } from '@nestjs/platform-express';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './event.entity';
import { EventsProcessor } from './events.processor';
import { StorageModule } from '../storage/storage.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    BullModule.registerQueue({
      name: 'events',
    }),
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
    StorageModule,
    SearchModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, EventsProcessor],
  exports: [EventsService],
})
export class EventsModule {}
