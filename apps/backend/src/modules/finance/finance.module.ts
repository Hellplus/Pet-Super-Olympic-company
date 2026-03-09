import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevenueRecord } from './entities/revenue-record.entity';
import { SettlementBill } from './entities/settlement-bill.entity';
import { EventBudget } from './entities/event-budget.entity';
import { BudgetItem } from './entities/budget-item.entity';
import { ExpenseRequest } from './entities/expense-request.entity';
import { ApprovalConfig } from './entities/approval-config.entity';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RevenueRecord, SettlementBill, EventBudget, BudgetItem, ExpenseRequest, ApprovalConfig])],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
