import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(RevenueRecord) private revenueRepo: Repository<RevenueRecord>,
    @InjectRepository(SponsorContract) private contractRepo: Repository<SponsorContract>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(EventTask) private taskRepo: Repository<EventTask>,
    @InjectRepository(EventBudget) private budgetRepo: Repository<EventBudget>,
    @InjectRepository(ExpenseRequest) private expenseRepo: Repository<ExpenseRequest>,
    @InjectRepository(Expert) private expertRepo: Repository<Expert>,
    @InjectRepository(ExpertAssignment) private assignmentRepo: Repository<ExpertAssignment>,
    @InjectRepository(BranchApplication) private branchAppRepo: Repository<BranchApplication>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    @InjectRepository(SettlementBill) private settlementRepo: Repository<SettlementBill>,
    @InjectRepository(Announcement) private announcementRepo: Repository<Announcement>,
  ) {}

  /** 全局概览（所有角色可见，根据权限过滤） */
  async getOverview(user: any) {
    const [branchCount, userCount, eventCount, expertCount] = await Promise.all([
      this.orgRepo.count({ where: { status: 1 } }),
      this.userRepo.count({ where: { status: 1 } }),
      this.eventRepo.count(),
      this.expertRepo.count(),
    ]);
    return { branchCount, userCount, eventCount, expertCount };
  }

  /** 总部总指挥大屏 */
  async getHqCommanderStats() {
    // 1. 全国招商总额排行榜（按分会）
    const sponsorRanking = await this.contractRepo
      .createQueryBuilder('c')
      .select('c.org_id', 'orgId')
      .addSelect('SUM(c.amount)', 'totalAmount')
      .addSelect('COUNT(*)', 'contractCount')
      .where('c.deleted_at IS NULL')
      .groupBy('c.org_id')
      .orderBy('"totalAmount"', 'DESC')
      .limit(20)
      .getRawMany();

    // 2. 总部应收账款（未结算的授权费）
    const receivableResult = await this.settlementRepo
      .createQueryBuilder('s')
      .select('SUM(s.commission_amount)', 'totalReceivable')
      .addSelect('SUM(CASE WHEN s.status = 1 THEN s.commission_amount ELSE 0 END)', 'paidAmount')
      .addSelect('SUM(CASE WHEN s.status = 0 THEN s.commission_amount ELSE 0 END)', 'unpaidAmount')
      .where('s.deleted_at IS NULL')
      .getRawOne();

    // 3. 全国赛事 SOP 红黄绿灯矩阵
    const sopMatrix = await this.taskRepo
      .createQueryBuilder('t')
      .select('t.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('t.deleted_at IS NULL')
      .groupBy('t.status')
      .getRawMany();

    // 4. 专业智库调度活跃度
    const expertStats = await this.assignmentRepo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.expert_id)', 'activeExperts')
      .addSelect('COUNT(*)', 'totalAssignments')
      .where('a.deleted_at IS NULL')
      .getRawOne();

    // 5. 分会入驻统计
    const branchStats = await this.branchAppRepo
      .createQueryBuilder('b')
      .select('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('b.deleted_at IS NULL')
      .groupBy('b.status')
      .getRawMany();

    // 6. 最新公告
    const recentAnnouncements = await this.announcementRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      sponsorRanking,
      receivable: receivableResult || { totalReceivable: 0, paidAmount: 0, unpaidAmount: 0 },
      sopMatrix,
      expertStats: expertStats || { activeExperts: 0, totalAssignments: 0 },
      branchStats,
      recentAnnouncements,
    };
  }

  /** 总部财务总监大屏 */
  async getHqFinanceStats() {
    // 1. 全网资金池流水曲线（按月统计）
    const monthlyRevenue = await this.revenueRepo
      .createQueryBuilder('r')
      .select("TO_CHAR(r.created_at, 'YYYY-MM')", 'month')
      .addSelect('SUM(r.amount)', 'totalAmount')
      .addSelect('SUM(r.hq_commission_amount)', 'hqCommission')
      .where('r.deleted_at IS NULL')
      .groupBy("TO_CHAR(r.created_at, 'YYYY-MM')")
      .orderBy('"month"', 'ASC')
      .getRawMany();

    // 2. 各地超预算频率趋势
    const overBudgetStats = await this.expenseRepo
      .createQueryBuilder('e')
      .select('e.org_id', 'orgId')
      .addSelect('COUNT(*)', 'totalExpenses')
      .addSelect('SUM(CASE WHEN e.is_over_budget = true THEN 1 ELSE 0 END)', 'overBudgetCount')
      .where('e.deleted_at IS NULL')
      .groupBy('e.org_id')
      .getRawMany();

    // 3. 未核销糊涂账预警（已审批但未上传凭证）
    const unreconciledExpenses = await this.expenseRepo
      .createQueryBuilder('e')
      .select('e.id', 'id')
      .addSelect('e.subject', 'subject')
      .addSelect('e.amount', 'amount')
      .addSelect('e.org_id', 'orgId')
      .addSelect('e.created_at', 'createdAt')
      .where('e.deleted_at IS NULL')
      .andWhere('e.status = :status', { status: 2 })
      .andWhere('e.payment_voucher_url IS NULL')
      .orderBy('e.created_at', 'ASC')
      .limit(50)
      .getRawMany();

    // 4. 预算消耗概览
    const budgetHealth = await this.budgetRepo
      .createQueryBuilder('b')
      .select('b.org_id', 'orgId')
      .addSelect('SUM(b.total_budget)', 'totalBudget')
      .addSelect('SUM(b.used_amount)', 'usedBudget')
      .addSelect('SUM(b.remaining_amount)', 'remainingBudget')
      .where('b.deleted_at IS NULL')
      .groupBy('b.org_id')
      .getRawMany();

    return {
      monthlyRevenue,
      overBudgetStats,
      unreconciledExpenses,
      budgetHealth,
    };
  }

  /** 地方分会大屏 */
  async getBranchStats(orgId: string) {
    // 1. 本分会赞助目标达成率
    const sponsorStats = await this.contractRepo
      .createQueryBuilder('c')
      .select('COUNT(*)', 'contractCount')
      .addSelect('SUM(c.amount)', 'totalAmount')
      .addSelect("SUM(CASE WHEN c.status = 'active' THEN c.amount ELSE 0 END)", 'activeAmount')
      .where('c.org_id = :orgId', { orgId })
      .andWhere('c.deleted_at IS NULL')
      .getRawOne();

    // 2. 本分会预算消耗健康度
    const budgetStats = await this.budgetRepo
      .createQueryBuilder('b')
      .select('b.event_name', 'eventName')
      .addSelect('b.total_budget', 'totalAmount')
      .addSelect('b.used_amount', 'usedAmount')
      .addSelect('b.remaining_amount', 'remainingAmount')
      .where('b.org_id = :orgId', { orgId })
      .andWhere('b.deleted_at IS NULL')
      .getRawMany();

    // 3. 本分会赛事任务进度
    const eventProgress = await this.eventRepo
      .createQueryBuilder('e')
      .select('e.id', 'id')
      .addSelect('e.name', 'name')
      .addSelect('e.event_date', 'eventDate')
      .addSelect('e.overall_progress', 'progress')
      .addSelect('e.status', 'status')
      .where('e.org_id = :orgId', { orgId })
      .andWhere('e.deleted_at IS NULL')
      .orderBy('e.event_date', 'ASC')
      .getRawMany();

    // 4. 本分会收入流水
    const revenueStats = await this.revenueRepo
      .createQueryBuilder('r')
      .select("TO_CHAR(r.created_at, 'YYYY-MM')", 'month')
      .addSelect('SUM(r.amount)', 'totalAmount')
      .where('r.org_id = :orgId', { orgId })
      .andWhere('r.deleted_at IS NULL')
      .groupBy("TO_CHAR(r.created_at, 'YYYY-MM')")
      .orderBy('"month"', 'ASC')
      .getRawMany();

    return {
      sponsorStats: sponsorStats || { contractCount: 0, totalAmount: 0, activeAmount: 0 },
      budgetStats,
      eventProgress,
      revenueStats,
    };
  }
}
