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
      SELECT c.id, c.cert_no as "certNo", c.cert_name as "certName",
             c.issuing_authority as "issuingAuthority",
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
      description: `${c.expertName || ''} - ${c.certName || ''} 到期日: ${c.expiryDate}`,
      link: '/branch-hr/cert-warning', time: c.createdAt, id: c.id,
    }));

    // 7. 即将到期的赞助合同（30天内）
    const contractWarnings = await this.contractRepo.manager.query(`
      SELECT c.id, c.contract_no as "contractNo", c.client_name as "clientName",
             c.amount, c.end_date as "endDate", c.created_at as "createdAt",
             c.sponsor_level as "sponsorLevel"
      FROM biz_sponsor_contract c
      WHERE c.deleted_at IS NULL
        AND c.status = 1
        AND c.end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
      ORDER BY c.end_date ASC LIMIT 10
    `);
    contractWarnings.forEach((c: any) => todos.push({
      type: 'contract_expiry', title: `赞助合同即将到期: ${c.contractNo}`,
      description: `${c.clientName || ''} - ¥${c.amount || 0} 到期日: ${c.endDate ? new Date(c.endDate).toLocaleDateString('zh-CN') : ''}`,
      link: '/sponsorship/contracts', time: c.createdAt, id: c.id,
    }));

    // 8. 未读公告
    const unreadAnnouncements = await this.announcementRepo.manager.query(`
      SELECT a.id, a.title, a.type, a.created_at as "createdAt", a.publish_time as "publishTime"
      FROM biz_announcement a
      WHERE a.deleted_at IS NULL
        AND a.status = 1
        AND a.id NOT IN (
          SELECT ar.announcement_id FROM biz_announcement_read ar WHERE ar.user_id = $1
        )
      ORDER BY a.publish_time DESC LIMIT 10
    `, [userId]);
    unreadAnnouncements.forEach((a: any) => {
      const typeMap: Record<string, string> = { red_header: '红头文件', urgent: '紧急通知', normal: '普通公告' };
      todos.push({
        type: 'unread_announcement', title: `未读公告: ${a.title}`,
        description: `[${typeMap[a.type] || a.type}] 发布于 ${a.publishTime ? new Date(a.publishTime).toLocaleString('zh-CN') : ''}`,
        link: '/event/announcement', time: a.publishTime || a.createdAt, id: a.id,
      });
    });

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
      contractExpiry: contractWarnings.length,
      unreadAnnouncements: unreadAnnouncements.length,
      total: todos.length,
    };

    return { todos, summary };
  }

  /** 通知计数（轻量级，用于铃铛轮询） */
  async getNotificationCount(userId: string, orgId: string, isSuperAdmin: boolean) {
    const counts = await this.expertRepo.manager.query(`
      SELECT
        (SELECT COUNT(*) FROM biz_expense_request WHERE deleted_at IS NULL AND status = 1
          ${isSuperAdmin ? '' : 'AND org_id = $2'}) AS "pendingExpenses",
        (SELECT COUNT(*) FROM biz_event_budget WHERE deleted_at IS NULL AND status = 0
          ${isSuperAdmin ? '' : 'AND org_id = $2'}) AS "pendingBudgets",
        ${isSuperAdmin ? `(SELECT COUNT(*) FROM biz_branch_application WHERE deleted_at IS NULL AND status = 0)` : '0'} AS "pendingApplications",
        (SELECT COUNT(*) FROM biz_event_task WHERE deleted_at IS NULL AND status IN (0,1) AND deadline < NOW()
          AND assignee_id = $1) AS "overdueTasks",
        (SELECT COUNT(*) FROM biz_settlement_bill WHERE deleted_at IS NULL AND status = 0
          ${isSuperAdmin ? '' : 'AND org_id = $2'}) AS "unpaidSettlements",
        (SELECT COUNT(*) FROM biz_expert_certificate WHERE deleted_at IS NULL
          AND expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') AS "certWarnings",
        (SELECT COUNT(*) FROM biz_sponsor_contract WHERE deleted_at IS NULL AND status = 1
          AND end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') AS "contractExpiry",
        (SELECT COUNT(*) FROM biz_announcement WHERE deleted_at IS NULL AND status = 1
          AND id NOT IN (SELECT announcement_id FROM biz_announcement_read WHERE user_id = $1)) AS "unreadAnnouncements"
    `, isSuperAdmin ? [userId] : [userId, orgId]);

    const c = counts[0] || {};
    const total = Object.values(c).reduce((sum: number, v: any) => sum + Number(v || 0), 0);
    return { ...c, total };
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

  /** 跨分部数据对比报表 */
  async getBranchComparison() {
    // 1. 赞助签约额排行
    const sponsorRanking = await this.contractRepo.manager.query(`
      SELECT c.org_id as "orgId", o.name as "orgName",
             COUNT(*) as "contractCount",
             COALESCE(SUM(c.amount), 0) as "totalAmount"
      FROM biz_sponsor_contract c
      LEFT JOIN sys_organization o ON c.org_id = o.id
      WHERE c.deleted_at IS NULL
      GROUP BY c.org_id, o.name
      ORDER BY "totalAmount" DESC
    `);

    // 2. 赛事完成率排行
    const eventCompletion = await this.eventRepo.manager.query(`
      SELECT e.org_id as "orgId", o.name as "orgName",
             COUNT(DISTINCT e.id) as "eventCount",
             COUNT(t.id) as "totalTasks",
             SUM(CASE WHEN t.status = 2 THEN 1 ELSE 0 END) as "completedTasks",
             CASE WHEN COUNT(t.id) > 0
               THEN ROUND(SUM(CASE WHEN t.status = 2 THEN 1 ELSE 0 END)::numeric / COUNT(t.id) * 100, 1)
               ELSE 0 END as "completionRate"
      FROM biz_event e
      LEFT JOIN biz_event_task t ON t.event_id = e.id AND t.deleted_at IS NULL
      LEFT JOIN sys_organization o ON e.org_id = o.id
      WHERE e.deleted_at IS NULL
      GROUP BY e.org_id, o.name
      ORDER BY "completionRate" DESC
    `);

    // 3. 预算使用率排行
    const budgetUsage = await this.budgetRepo.manager.query(`
      SELECT b.org_id as "orgId", o.name as "orgName",
             COALESCE(SUM(b.total_budget), 0) as "totalBudget",
             COALESCE(SUM(b.used_amount), 0) as "usedAmount",
             CASE WHEN SUM(b.total_budget) > 0
               THEN ROUND(SUM(b.used_amount)::numeric / SUM(b.total_budget) * 100, 1)
               ELSE 0 END as "usageRate"
      FROM biz_event_budget b
      LEFT JOIN sys_organization o ON b.org_id = o.id
      WHERE b.deleted_at IS NULL
      GROUP BY b.org_id, o.name
      ORDER BY "usageRate" DESC
    `);

    // 4. 专家资源排行
    const expertRanking = await this.expertRepo.manager.query(`
      SELECT e.org_id as "orgId", o.name as "orgName",
             COUNT(*) as "expertCount"
      FROM biz_expert e
      LEFT JOIN sys_organization o ON e.org_id = o.id
      WHERE e.deleted_at IS NULL
      GROUP BY e.org_id, o.name
      ORDER BY "expertCount" DESC
    `);

    // 5. 收入排行
    const revenueRanking = await this.revenueRepo.manager.query(`
      SELECT r.org_id as "orgId", o.name as "orgName",
             COUNT(*) as "recordCount",
             COALESCE(SUM(r.amount), 0) as "totalRevenue"
      FROM biz_revenue_record r
      LEFT JOIN sys_organization o ON r.org_id = o.id
      WHERE r.deleted_at IS NULL AND r.status = 1
      GROUP BY r.org_id, o.name
      ORDER BY "totalRevenue" DESC
    `);

    return { sponsorRanking, eventCompletion, budgetUsage, expertRanking, revenueRanking };
  }
}
