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
// Certificate warnings use raw SQL query, no entity import needed

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
      .addSelect('e.budget_subject', 'subject')
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

  /** 我的待办 + 消息中心 */
  async getMyTodos(userId: string, orgId: string, isSuperAdmin: boolean) {
    const todos: any[] = [];

    // 1. 待审批的报销单（超管看全部，否则看本组织）
    const expenseQb = this.expenseRepo.createQueryBuilder('e')
      .select(['e.id', 'e.expenseNo', 'e.budgetSubject', 'e.amount', 'e.applicantName', 'e.createdAt'])
      .where('e.deletedAt IS NULL')
      .andWhere('e.status = :s', { s: 1 });
    if (!isSuperAdmin) expenseQb.andWhere('e.orgId = :orgId', { orgId });
    const pendingExpenses = await expenseQb.orderBy('e.createdAt', 'DESC').take(20).getMany();
    pendingExpenses.forEach(e => todos.push({
      type: 'expense', title: `报销单待审批: ${e.expenseNo}`,
      description: `${e.applicantName} 申请 ¥${e.amount} - ${e.budgetSubject || ''}`,
      link: '/finance/expense', time: e.createdAt, id: e.id,
    }));

    // 2. 待审批的预算包
    const budgetQb = this.budgetRepo.createQueryBuilder('b')
      .select(['b.id', 'b.eventName', 'b.totalBudget', 'b.createdAt'])
      .where('b.deletedAt IS NULL')
      .andWhere('b.status = :s', { s: 0 });
    if (!isSuperAdmin) budgetQb.andWhere('b.orgId = :orgId', { orgId });
    const pendingBudgets = await budgetQb.orderBy('b.createdAt', 'DESC').take(10).getMany();
    pendingBudgets.forEach(b => todos.push({
      type: 'budget', title: `预算包待审批: ${b.eventName}`,
      description: `预算总额 ¥${b.totalBudget}`,
      link: '/finance/budget', time: b.createdAt, id: b.id,
    }));

    // 3. 待审批的分会入驻申请
    if (isSuperAdmin) {
      const pendingApps = await this.branchAppRepo.find({
        where: { status: 0 },
        order: { createdAt: 'DESC' },
        take: 10,
      });
      pendingApps.forEach(a => todos.push({
        type: 'application', title: `分会入驻待审批: ${a.branchName}`,
        description: `申请人: ${a.applicantName} - ${a.province}${a.city}`,
        link: '/branch-hr/application', time: a.createdAt, id: a.id,
      }));
    }

    // 4. 我负责的逾期赛事任务
    const overdueTasks = await this.taskRepo.createQueryBuilder('t')
      .select(['t.id', 't.taskName', 't.deadline', 't.createdAt'])
      .leftJoin('t.event', 'event')
      .addSelect('event.eventName')
      .where('t.deletedAt IS NULL')
      .andWhere('t.status IN (:...statuses)', { statuses: [0, 1] })
      .andWhere('t.deadline < NOW()')
      .andWhere('t.assigneeId = :userId', { userId })
      .orderBy('t.deadline', 'ASC')
      .take(20)
      .getMany();
    overdueTasks.forEach(t => todos.push({
      type: 'task_overdue', title: `赛事任务逾期: ${t.taskName}`,
      description: `截止日期: ${t.deadline}`,
      link: '/event/sop-progress', time: t.createdAt, id: t.id,
    }));

    // 5. 未缴清算账单
    const unpaidSettlements = this.settlementRepo.createQueryBuilder('s')
      .select(['s.id', 's.period', 's.commissionAmount', 's.createdAt'])
      .where('s.deletedAt IS NULL')
      .andWhere('s.status = :s', { s: 0 });
    if (!isSuperAdmin) unpaidSettlements.andWhere('s.orgId = :orgId', { orgId });
    const settlements = await unpaidSettlements.orderBy('s.createdAt', 'DESC').take(10).getMany();
    settlements.forEach(s => todos.push({
      type: 'settlement', title: `清算账单待缴款: ${s.period}`,
      description: `应缴金额 ¥${s.commissionAmount}`,
      link: '/finance/settlement', time: s.createdAt, id: s.id,
    }));

    // 6. 即将到期的证书（30天内）
    const certWarnings = await this.expertRepo.manager.query(`
      SELECT c.id, c.cert_no as "certNo", c.issuer_name as "issuerName",
             c.expiry_date as "expiryDate", c.created_at as "createdAt",
             e.name as "expertName"
      FROM biz_expert_certificate c
      LEFT JOIN biz_expert e ON c.expert_id = e.id
      WHERE c.deleted_at IS NULL
        AND c.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
      ORDER BY c.expiry_date ASC LIMIT 10
    `);
    certWarnings.forEach((c: any) => todos.push({
      type: 'cert_warning', title: `证书即将到期: ${c.certNo}`,
      description: `${c.expertName || ''} - ${c.issuerName || ''} 到期日: ${c.expiryDate}`,
      link: '/branch-hr/cert-warning', time: c.createdAt, id: c.id,
    }));

    // 按时间排序
    todos.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // 统计
    const summary = {
      pendingExpenses: pendingExpenses.length,
      pendingBudgets: pendingBudgets.length,
      pendingApplications: isSuperAdmin ? (await this.branchAppRepo.count({ where: { status: 0 } })) : 0,
      overdueTasks: overdueTasks.length,
      unpaidSettlements: settlements.length,
      certWarnings: certWarnings.length,
      total: todos.length,
    };

    return { todos, summary };
  }

  /** 地方分会大屏 */
  async getBranchStats(orgId: string) {
    // 1. 本分会赞助目标达成率
    const sponsorStats = await this.contractRepo
      .createQueryBuilder('c')
      .select('COUNT(*)', 'contractCount')
      .addSelect('SUM(c.amount)', 'totalAmount')
      .addSelect("SUM(CASE WHEN c.status = 1 THEN c.amount ELSE 0 END)", 'activeAmount')
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
      .addSelect('e.event_name', 'name')
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
