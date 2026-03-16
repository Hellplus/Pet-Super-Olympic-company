import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExcelService } from '../../common/services/excel.service';
import { Expert } from '../branch-hr/entities/expert.entity';
import { ExpertCertificate } from '../branch-hr/entities/expert-certificate.entity';
import { RevenueRecord } from '../finance/entities/revenue-record.entity';
import { ExpenseRequest } from '../finance/entities/expense-request.entity';
import { SponsorContract } from '../sponsorship/entities/sponsor-contract.entity';
import { SponsorClient } from '../sponsorship/entities/sponsor-client.entity';
import { Event } from '../event/entities/event.entity';
import { EventBudget } from '../finance/entities/event-budget.entity';
import { SettlementBill } from '../finance/entities/settlement-bill.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Expert,
      ExpertCertificate,
      RevenueRecord,
      ExpenseRequest,
      SponsorContract,
      SponsorClient,
      Event,
      EventBudget,
      SettlementBill,
    ]),
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }),
  ],
  controllers: [ExportController],
  providers: [ExportService, ExcelService],
})
export class ExportModule {}
