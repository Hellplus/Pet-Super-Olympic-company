import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevenueRecord } from './entities/revenue-record.entity';
import { SettlementBill } from './entities/settlement-bill.entity';
import { EventBudget } from './entities/event-budget.entity';
import { BudgetItem } from './entities/budget-item.entity';
import { ExpenseRequest } from './entities/expense-request.entity';
import { ApprovalConfig } from './entities/approval-config.entity';
import { CreateRevenueDto, QueryRevenueDto, CreateEventBudgetDto, CreateExpenseDto, QueryExpenseDto, ConfirmPaymentDto } from './dto/finance.dto';
import { paginate } from '../../common/utils/pagination.util';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(RevenueRecord) private readonly revenueRepo: Repository<RevenueRecord>,
    @InjectRepository(SettlementBill) private readonly billRepo: Repository<SettlementBill>,
    @InjectRepository(EventBudget) private readonly budgetRepo: Repository<EventBudget>,
    @InjectRepository(BudgetItem) private readonly budgetItemRepo: Repository<BudgetItem>,
    @InjectRepository(ExpenseRequest) private readonly expenseRepo: Repository<ExpenseRequest>,
    @InjectRepository(ApprovalConfig) private readonly approvalConfigRepo: Repository<ApprovalConfig>,
  ) {}

  // ====== 收款登记 ======
  async createRevenue(dto: CreateRevenueDto, userId: string) {
    const no = 'RV' + Date.now().toString(36).toUpperCase();
    const hqAmount = Number((dto.amount * 0.20).toFixed(2)); // 默认20%
    return this.revenueRepo.save(this.revenueRepo.create({
      ...dto, revenueNo: no, hqCommissionRate: 20, hqCommissionAmount: hqAmount, createdBy: userId,
    }));
  }

  async findAllRevenues(query: QueryRevenueDto) {
    const qb = this.revenueRepo.createQueryBuilder('entity').leftJoinAndSelect('entity.organization', 'org');
    if (query.orgId) qb.andWhere('entity.org_id = :o', { o: query.orgId });
    if (query.revenueType) qb.andWhere('entity.revenue_type = :t', { t: query.revenueType });
    if (query.startDate) qb.andWhere('entity.revenue_date >= :sd', { sd: query.startDate });
    if (query.endDate) qb.andWhere('entity.revenue_date <= :ed', { ed: query.endDate });
    qb.orderBy('entity.revenue_date', 'DESC');
    return paginate(qb, query);
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
    const qb = this.billRepo.createQueryBuilder('entity').leftJoinAndSelect('entity.organization', 'org');
    if (orgId) qb.where('entity.org_id = :o', { o: orgId });
    qb.orderBy('entity.created_at', 'DESC');
    return qb.getMany();
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

  async approveBudget(id: string, approve: boolean) {
    const b = await this.budgetRepo.findOneOrFail({ where: { id } });
    b.status = approve ? 1 : 2;
    return this.budgetRepo.save(b);
  }

  async findBudgetById(id: string) {
    const b = await this.budgetRepo.findOne({ where: { id }, relations: ['organization'] });
    if (!b) throw new NotFoundException('预算包不存在');
    const items = await this.budgetItemRepo.find({ where: { budgetId: id } });
    return { ...b, items };
  }

  async findAllBudgets(orgId?: string) {
    const qb = this.budgetRepo.createQueryBuilder('entity').leftJoinAndSelect('entity.organization', 'org');
    if (orgId) qb.where('entity.org_id = :o', { o: orgId });
    qb.orderBy('entity.created_at', 'DESC');
    return qb.getMany();
  }

  // ====== 报销/付款单 ======
  async createExpense(dto: CreateExpenseDto, userId: string, userName: string) {
    // === PRD "超支硬拦截" ===
    let isOverBudget = false;
    if (dto.budgetId) {
      const budget = await this.budgetRepo.findOneOrFail({ where: { id: dto.budgetId } });
      if (budget.status !== 1) throw new BadRequestException('该预算包未审批通过');

      // 检查总预算余额
      if (dto.amount > Number(budget.remainingAmount)) {
        isOverBudget = true;
      }

      // 检查单科目预算（如有指定科目）
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

      // 硬拦截：超预算直接拒绝，必须走超预算特批
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
      // status 10 = 超预算特批待审 (需要总部审批)
    }));
  }

  async findAllExpenses(query: QueryExpenseDto) {
    const qb = this.expenseRepo.createQueryBuilder('entity').leftJoinAndSelect('entity.organization', 'org');
    if (query.orgId) qb.andWhere('entity.org_id = :o', { o: query.orgId });
    if (query.status !== undefined) qb.andWhere('entity.status = :s', { s: query.status });
    if (query.expenseType) qb.andWhere('entity.expense_type = :t', { t: query.expenseType });
    qb.orderBy('entity.created_at', 'DESC');
    return paginate(qb, query);
  }

  async approveExpense(id: string, approve: boolean) {
    const e = await this.expenseRepo.findOneOrFail({ where: { id } });
    e.status = approve ? 3 : 4;
    // 如果通过且关联预算,扣减预算余额
    if (approve && e.budgetId) {
      await this.budgetRepo.createQueryBuilder().update(EventBudget)
        .set({ usedAmount: () => `used_amount + ${Number(e.amount)}`, remainingAmount: () => `remaining_amount - ${Number(e.amount)}` })
        .where('id = :id', { id: e.budgetId }).execute();
    }
    return this.expenseRepo.save(e);
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
}
