import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtectedCategory } from './entities/protected-category.entity';
import { SponsorClient } from './entities/sponsor-client.entity';
import { SponsorContract } from './entities/sponsor-contract.entity';
import { DeliveryTask } from './entities/delivery-task.entity';
import { SponsorshipService } from './sponsorship.service';
import { SponsorshipController } from './sponsorship.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProtectedCategory, SponsorClient, SponsorContract, DeliveryTask])],
  controllers: [SponsorshipController],
  providers: [SponsorshipService],
  exports: [SponsorshipService],
})
export class SponsorshipModule {}
