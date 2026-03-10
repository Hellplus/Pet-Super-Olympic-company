import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { RevenueRecord } from '../finance/entities/revenue-record.entity';
import { SponsorContract } from '../sponsorship/entities/sponsor-contract.entity';
import { Event } from '../event/entities/event.entity';
import { EventTask } from '../event/entities/event-task.entity';
import { EventBudget } from '../finance/entities/event-budget.entity';
import { ExpenseRequest } from '../finance/entities/expense-request.entity';
import { Expert } from '../branch-hr/entities/expert.entity';
import { ExpertAssignment } from '../branch-hr/entities/expert-assignment.entity';
import { BranchApplication } from '../branch-hr/entities/branch-application.entity';
import { User } from '../user/entities/user.entity';
import { Organization } from '../organization/entities/organization.entity';
import { SettlementBill } from '../finance/entities/settlement-bill.entity';
import { Announcement } from '../event/entities/announcement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RevenueRecord, SponsorContract, Event, EventTask,
      EventBudget, ExpenseRequest, Expert, ExpertAssignment,
      BranchApplication, User, Organization, SettlementBill,
      Announcement,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
