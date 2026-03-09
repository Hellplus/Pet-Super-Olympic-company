import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { SopTemplate } from './entities/sop-template.entity';
import { SopTemplateTask } from './entities/sop-template-task.entity';
import { EventTask } from './entities/event-task.entity';
import { Announcement } from './entities/announcement.entity';
import { AnnouncementRead } from './entities/announcement-read.entity';
import { DigitalAsset } from './entities/digital-asset.entity';
import { EventService } from './event.service';
import { EventController } from './event.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Event, SopTemplate, SopTemplateTask, EventTask, Announcement, AnnouncementRead, DigitalAsset])],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
