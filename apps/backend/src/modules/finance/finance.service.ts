import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { RevenueRecord } from './entities/revenue-record.entity';
import { SettlementBill } from './entities/settlement-bill.entity';
import { EventBudget } from './entities/event-budget.entity';
import { BudgetItem } from './entities/budget-item.entity';
import { ExpenseRequest } from './entities/expense-request.entity';
import { ApprovalConfig } from './entities/approval-config.entity';
import { ApprovalRecord } from '../branch-hr/entities/approval-record.entity';
import { CreateRevenueDto, QueryRevenueDto, CreateEventBudgetDto, CreateExpenseDto, QueryExpenseDto, ConfirmPaymentDto } from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(RevenueRecord) private readonly revenueRepo: Repository<RevenueRecord>,
    @InjectRepository(SettlementBill) private readonly billRepo: Repository<SettlementBill>,
    @InjectRepository(EventBudget) private readonly budgetRepo: Repository<EventBudget>,
    @InjectRepository(BudgetItem) private readonly budgetItemRepo: Repository<BudgetItem>,
    @InjectRepository(ExpenseRequest) private readonly expenseRepo: Repository<ExpenseRequest>,
    @InjectRepository(ApprovalConfig) private readonly approvalConfigRepo: Repository<ApprovalConfig>,
    @InjectRepository(ApprovalRecord) private readonly approvalRecordRepo: Repository<ApprovalRecord>,
  ) {}

  // ====== 收款登记 ======
  async createRevenue(dto: CreateRevenueDto, userId: string) {
    const no = 'RV' + Date.now().toString(36).toUpperCase();
    const hqAmount = Number((dto.amount * 0.20).toFixed(2));
    return this.revenueRepo.save(this.revenueRepo.create({
      ...dto, revenueNo: no, hqCommissionRate: 20, hqCommissionAmount: hqAmount, createdBy: userId,
    }));
  }

  async findAllRevenues(query: QueryRevenueDto) {
    const where: FindOptionsWhere<RevenueRecord> = {};
    if (query.orgId) where.orgId = query.orgId;
    if (query.revenueType) where.revenueType = query.revenueType;
    const page = (query as any).current || query.page || 1;
    const pageSize = query.pageSize || 20;
    const [items, total] = await this.revenueRepo.findAndCount({
      where,
      order: { revenueDate: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // ====== 清算账单 ======
  async generateSettlementBill(orgId: string, period: string) {
    const revenues = await this.revenueRepo.find({ where: { orgId, isSettled: false, status: 1 } });
    const totalRevenue = revenues.reduce((sum, r) => sum + Number(r.amount), 0);
    const commissionRate = 20;
    const commissionAmount = Number((totalRevenue * commissionRate / 100).toFixed(2));
    const no = 'STL' + Date.now().toString(36).toUpperCase();
    return this.billRepo.save(this.billRepo.create({
      orgId, billNo: no, period, totalRevenue, commissionRate, commissionAmount,
    }));
  }

  async findAllBills(orgId?: string) {
    const where: FindOptionsWhere<SettlementBill> = {};
    if (orgId) where.orgId = orgId;
    return this.billRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  // ====== 赛事预算包 ======
  async createBudget(dto: CreateEventBudgetDto, userId: string) {
    const budget = this.budgetRepo.create({
      orgId: dto.orgId, eventId: dto.eventId, eventName: dto.eventName,
      totalBudget: dto.totalBudget, remainingAmount: dto.totalBudget, createdBy: userId,
    });
    const saved = await this.budgetRepo.save(budget);
    if (dto.items?.length) {
      const items = dto.items.map(i => this.budgetItemRepo.create({
        budgetId: saved.id, subjectName: i.subjectName, budgetAmount: i.budgetAmount,
      }));
      await this.budgetItemRepo.save(items);
    }
    return saved;
  }

  async approveBudget(id: string, approve: boolean, userId?: string, userName?: string, opinion?: string) {
    const b = await this.budgetRepo.findOneOrFail({ where: { id } });
    b.status = approve ? 1 : 2;
    await this.budgetRepo.save(b);
    // 记录审批记录
    await this.approvalRecordRepo.save(this.approvalRecordRepo.create({
      bizType: 'BUDGET', bizId: id, step: 1, stepName: approve ? '审批通过' : '审批驳回',
      approverId: userId || '', approverName: userName || '', result: approve ? 1 : 2, opinion: opinion || '',
    }));
    return b;
  }

  async findBudgetById(id: string) {
    const b = await this.budgetRepo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('预算包不存在');
    const items = await this.budgetItemRepo.find({ where: { budgetId: id } });
    return { ...b, items };
  }

  async findAllBudgets(orgId?: string) {
    const where: FindOptionsWhere<EventBudget> = {};
    if (orgId) where.orgId = orgId;
    return this.budgetRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  // ====== 报销/付款单 ======
  async createExpense(dto: CreateExpenseDto, userId: string, userName: string) {
    let isOverBudget = false;
    if (dto.budgetId) {
      const budget = await this.budgetRepo.findOneOrFail({ where: { id: dto.budgetId } });
      if (budget.status !== 1) throw new BadRequestException('该预算包未审批通过');
      if (dto.amount > Number(budget.remainingAmount)) {
        isOverBudget = true;
      }
      if (dto.subjectName) {
        const item = await this.budgetItemRepo.findOne({
          where: { budgetId: dto.budgetId, subjectName: dto.subjectName },
        });
        if (item) {
          const subjectUsed = Number(item.usedAmount || 0);
          if (subjectUsed + dto.amount > Number(item.budgetAmount)) {
            isOverBudget = true;
          }
        }
      }
      if (isOverBudget && !dto.forceOverBudget) {
        throw new BadRequestException(
          '超预算拦截：该笔报销将导致预算超支！请发起《超预算特批申请》（勾选"超预算特批"选项）。'
        );
      }
    }
    const no = 'EXP' + Date.now().toString(36).toUpperCase();
    return this.expenseRepo.save(this.expenseRepo.create({
      ...dto, expenseNo: no, applicantId: userId, applicantName: userName,
      isOverBudget, status: isOverBudget ? 10 : 1, createdBy: userId,
    }));
  }

  async findAllExpenses(query: QueryExpenseDto) {
    const where: FindOptionsWhere<ExpenseRequest> = {};
    if (query.orgId) where.orgId = query.orgId;
    if (query.status !== undefined) where.status = query.status;
    if (query.expenseType) where.expenseType = query.expenseType;
    const page = (query as any).current || query.page || 1;
    const pageSize = query.pageSize || 20;
    const [items, total] = await this.expenseRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async approveExpense(id: string, approve: boolean, userId?: string, userName?: string, opinion?: string) {
    const e = await this.expenseRepo.findOneOrFail({ where: { id } });
    const prevStatus = e.status;
    if (approve) {
      const route = await this.getApprovalRoute('EXPENSE', Number(e.amount));
      if (route && route.approvalLevel === 'HQ' && e.status === 1) {
        e.status = 2; // 需要总部复审
        await this.expenseRepo.save(e);
        await this.approvalRecordRepo.save(this.approvalRecordRepo.create({
          bizType: 'EXPENSE', bizId: id, step: 1, stepName: '地方初审通过',
          approverId: userId || '', approverName: userName || '', result: 1, opinion: opinion || '',
        }));
        return e;
      }
      e.status = 3;
    } else {
      e.status = 4;
    }
    if (e.status === 3 && e.budgetId) {
      await this.budgetRepo.createQueryBuilder().update(EventBudget)
        .set({ usedAmount: () => `used_amount + ${Number(e.amount)}`, remainingAmount: () => `remaining_amount - ${Number(e.amount)}` })
        .where('id = :id', { id: e.budgetId }).execute();
    }
    await this.expenseRepo.save(e);
    // 记录审批记录
    const step = prevStatus === 2 ? 2 : 1;
    const stepName = approve ? (step === 2 ? '总部终审通过' : '审批通过') : '审批驳回';
    await this.approvalRecordRepo.save(this.approvalRecordRepo.create({
      bizType: 'EXPENSE', bizId: id, step, stepName,
      approverId: userId || '', approverName: userName || '', result: approve ? 1 : 2, opinion: opinion || '',
    }));
    return e;
  }

  /** 转签（委派给其他审批人） */
  async forwardApproval(bizType: string, bizId: string, fromUserId: string, fromUserName: string, toUserId: string, toUserName: string, opinion?: string) {
    await this.approvalRecordRepo.save(this.approvalRecordRepo.create({
      bizType, bizId, step: 0, stepName: '转签',
      approverId: fromUserId, approverName: fromUserName, result: 0,
      opinion: `转签给 ${toUserName}: ${opinion || ''}`,
    }));
    return { success: true, message: `已转签给 ${toUserName}` };
  }

  /** 查询审批记录 */
  async getApprovalRecords(bizType: string, bizId: string) {
    return this.approvalRecordRepo.find({
      where: { bizType, bizId },
      order: { createdAt: 'ASC' },
    });
  }

  async confirmPayment(id: string, dto: ConfirmPaymentDto) {
    const e = await this.expenseRepo.findOneOrFail({ where: { id } });
    if (e.status !== 3) throw new BadRequestException('只有审批通过的单据才能确认付款');
    if (!dto.paymentVoucherUrl) throw new BadRequestException('必须上传银行电子回单');
    e.paymentVoucherUrl = dto.paymentVoucherUrl;
    e.status = 5;
    e.paidAt = new Date();
    return this.expenseRepo.save(e);
  }

  // ====== 审批配置 ======
  async getApprovalConfigs() {
    return this.approvalConfigRepo.find({ order: { bizType: 'ASC', minAmount: 'ASC' } });
  }

  async upsertApprovalConfig(data: Partial<ApprovalConfig>) {
    return this.approvalConfigRepo.save(this.approvalConfigRepo.create(data));
  }

  async getApprovalRoute(bizType: string, amount: number) {
    const configs = await this.approvalConfigRepo.find({
      where: { bizType, status: 1 },
      order: { minAmount: 'ASC' },
    });
    for (const c of configs) {
      const min = Number(c.minAmount);
      const max = c.maxAmount ? Number(c.maxAmount) : Infinity;
      if (amount >= min && amount < max) {
        return {
          configId: c.id,
          bizType: c.bizType,
          approvalLevel: (c.approvalLevels as any)?.[0]?.level || 'LOCAL',
          approvalLevels: c.approvalLevels,
          description: `金额 ¥${amount} 匹配规则: ¥${min}${max === Infinity ? '+' : '~¥' + max}`,
        };
      }
    }
    return { approvalLevel: 'LOCAL', description: '无匹配规则,默认地方终审' };
  }

  async batchGenerateSettlement(period: string) {
    const revenues = await this.revenueRepo.createQueryBuilder('r')
      .select('r.org_id', 'orgId')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(r.amount)', 'totalRevenue')
      .where('r.is_settled = false AND r.status = 1')
      .groupBy('r.org_id')
      .getRawMany();

    const bills = [];
    for (const row of revenues) {
      if (Number(row.totalRevenue) > 0) {
        const bill = await this.generateSettlementBill(row.orgId, period);
        bills.push(bill);
      }
    }
    return { generatedCount: bills.length, bills };
  }

  async markBillReminded(billId: string) {
    const bill = await this.billRepo.findOneOrFail({ where: { id: billId } });
    bill.status = 2;
    return this.billRepo.save(bill);
  }
}
