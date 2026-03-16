import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { ExcelService, ExcelColumn } from '../../common/services/excel.service';
import { Expert } from '../branch-hr/entities/expert.entity';
import { ExpertCertificate } from '../branch-hr/entities/expert-certificate.entity';
import { RevenueRecord } from '../finance/entities/revenue-record.entity';
import { ExpenseRequest } from '../finance/entities/expense-request.entity';
import { SponsorContract } from '../sponsorship/entities/sponsor-contract.entity';
import { SponsorClient } from '../sponsorship/entities/sponsor-client.entity';
import { Event } from '../event/entities/event.entity';
import { EventBudget } from '../finance/entities/event-budget.entity';
import { SettlementBill } from '../finance/entities/settlement-bill.entity';

const EXPERT_TYPE_MAP: Record<string, string> = { JUDGE: '裁判', VET: '兽医', BEHAVIOR: '行为学家', OTHER: '其他' };
const GENDER_MAP: Record<number, string> = { 0: '未知', 1: '男', 2: '女' };
const CERT_TYPE_MAP: Record<string, string> = { expert: '专家', judge: '裁判', committee: '赛组委', local: '地方', other: '其他' };
const REVENUE_TYPE_MAP: Record<string, string> = { SPONSOR: '赞助费', ENTRY_FEE: '报名费', OTHER: '其他' };
const EXPENSE_STATUS_MAP: Record<number, string> = { 0: '草稿', 1: '待审批', 2: '审批中', 3: '已通过', 4: '已驳回', 5: '已支付', 6: '已核销' };
const CONTRACT_STATUS_MAP: Record<number, string> = { 0: '草稿', 1: '生效中', 2: '已完成', 3: '已终止' };
const EVENT_STATUS_MAP: Record<number, string> = { 0: '筹备中', 1: '进行中', 2: '已完成', 3: '已关闭', 9: '已取消' };
const BUDGET_STATUS_MAP: Record<number, string> = { 0: '待审批', 1: '已通过', 2: '已驳回', 3: '已关闭' };
const SETTLEMENT_STATUS_MAP: Record<number, string> = { 0: '待确认', 1: '已确认', 2: '已催办', 3: '已支付', 4: '已核销' };

@Injectable()
export class ExportService {
  constructor(
    private readonly excelService: ExcelService,
    @InjectRepository(Expert) private expertRepo: Repository<Expert>,
    @InjectRepository(ExpertCertificate) private certRepo: Repository<ExpertCertificate>,
    @InjectRepository(RevenueRecord) private revenueRepo: Repository<RevenueRecord>,
    @InjectRepository(ExpenseRequest) private expenseRepo: Repository<ExpenseRequest>,
    @InjectRepository(SponsorContract) private contractRepo: Repository<SponsorContract>,
    @InjectRepository(SponsorClient) private clientRepo: Repository<SponsorClient>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(EventBudget) private budgetRepo: Repository<EventBudget>,
    @InjectRepository(SettlementBill) private settlementRepo: Repository<SettlementBill>,
  ) {}

  // ========== 导出 ==========

  async exportExperts(res: Response, query: any) {
    const qb = this.expertRepo.createQueryBuilder('e').where('e.deleted_at IS NULL');
    if (query.expertType) qb.andWhere('e.expert_type = :t', { t: query.expertType });
    const data = await qb.orderBy('e.created_at', 'DESC').getMany();

    const columns: ExcelColumn[] = [
      { header: '姓名', key: 'name', width: 12 },
      { header: '类型', key: 'expertType', width: 12, transform: (v) => EXPERT_TYPE_MAP[v] || v },
      { header: '星级', key: 'starLevel', width: 8, transform: (v) => '★'.repeat(v || 0) },
      { header: '性别', key: 'gender', width: 8, transform: (v) => GENDER_MAP[v] || '未知' },
      { header: '手机', key: 'phone', width: 15 },
      { header: '邮箱', key: 'email', width: 22 },
      { header: '国籍', key: 'nationality', width: 12 },
      { header: '简介', key: 'bio', width: 30 },
      { header: '创建时间', key: 'createdAt', width: 20, transform: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '' },
    ];
    await this.excelService.exportToResponse(res, data, columns, '专家列表', '专家数据');
  }

  async exportCertificates(res: Response, query: any) {
    const qb = this.certRepo.createQueryBuilder('c').where('c.deleted_at IS NULL');
    if (query.certType) qb.andWhere('c.cert_type = :t', { t: query.certType });
    if (query.status === 'expired') qb.andWhere('c.expiry_date < CURRENT_DATE');
    else if (query.status === 'valid') qb.andWhere('(c.expiry_date IS NULL OR c.expiry_date >= CURRENT_DATE)');
    const data = await qb.orderBy('c.expiry_date', 'ASC').getMany();

    const columns: ExcelColumn[] = [
      { header: '证书类型', key: 'certType', width: 12, transform: (v) => CERT_TYPE_MAP[v] || v },
      { header: '持证人', key: 'holderName', width: 12 },
      { header: '证书名称', key: 'certName', width: 22 },
      { header: '证书编号', key: 'certNo', width: 18 },
      { header: '发证机构', key: 'issuingAuthority', width: 22 },
      { header: '颁发日期', key: 'issueDate', width: 14, transform: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '' },
      { header: '到期日期', key: 'expiryDate', width: 14, transform: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '永久' },
      { header: '状态', key: 'isExpired', width: 10, transform: (v, row) => {
        if (!row.expiryDate) return '有效';
        return new Date(row.expiryDate) < new Date() ? '已过期' : '有效';
      }},
    ];
    await this.excelService.exportToResponse(res, data, columns, '证书列表', '证书数据');
  }

  async exportRevenues(res: Response, query: any) {
    const qb = this.revenueRepo.createQueryBuilder('r').where('r.deleted_at IS NULL');
    if (query.orgId) qb.andWhere('r.org_id = :o', { o: query.orgId });
    if (query.revenueType) qb.andWhere('r.revenue_type = :t', { t: query.revenueType });
    const data = await qb.orderBy('r.revenue_date', 'DESC').getMany();

    const columns: ExcelColumn[] = [
      { header: '收款单号', key: 'revenueNo', width: 18 },
      { header: '付款方', key: 'payerName', width: 22 },
      { header: '金额', key: 'amount', width: 14 },
      { header: '收款类型', key: 'revenueType', width: 12, transform: (v) => REVENUE_TYPE_MAP[v] || v },
      { header: '收款日期', key: 'revenueDate', width: 14, transform: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '' },
      { header: '总部提成率(%)', key: 'hqCommissionRate', width: 14 },
      { header: '总部提成额', key: 'hqCommissionAmount', width: 14 },
      { header: '是否已结算', key: 'isSettled', width: 12, transform: (v) => v ? '已结算' : '未结算' },
    ];
    await this.excelService.exportToResponse(res, data, columns, '收款记录', '收款数据');
  }

  async exportExpenses(res: Response, query: any) {
    const qb = this.expenseRepo.createQueryBuilder('e').where('e.deleted_at IS NULL');
    if (query.orgId) qb.andWhere('e.org_id = :o', { o: query.orgId });
    const data = await qb.orderBy('e.created_at', 'DESC').getMany();

    const columns: ExcelColumn[] = [
      { header: '单号', key: 'expenseNo', width: 18 },
      { header: '类型', key: 'expenseType', width: 12, transform: (v) => v === 'REIMBURSE' ? '报销' : '付款' },
      { header: '金额', key: 'amount', width: 14 },
      { header: '申请人', key: 'applicantName', width: 12 },
      { header: '用途说明', key: 'description', width: 30 },
      { header: '预算科目', key: 'budgetSubject', width: 14 },
      { header: '是否超预算', key: 'isOverBudget', width: 12, transform: (v) => v ? '是' : '否' },
      { header: '状态', key: 'status', width: 10, transform: (v) => EXPENSE_STATUS_MAP[v] || '未知' },
      { header: '申请时间', key: 'createdAt', width: 20, transform: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '' },
    ];
    await this.excelService.exportToResponse(res, data, columns, '报销记录', '报销数据');
  }

  async exportContracts(res: Response, query: any) {
    const qb = this.contractRepo.createQueryBuilder('c').where('c.deleted_at IS NULL');
    if (query.orgId) qb.andWhere('c.org_id = :o', { o: query.orgId });
    const data = await qb.orderBy('c.created_at', 'DESC').getMany();

    const LEVEL_MAP: Record<string, string> = { TITLE: '冠名', GOLD: '金牌', SILVER: '银牌', OTHER: '其他' };
    const columns: ExcelColumn[] = [
      { header: '合同编号', key: 'contractNo', width: 18 },
      { header: '赞助级别', key: 'sponsorLevel', width: 12, transform: (v) => LEVEL_MAP[v] || v },
      { header: '合同金额', key: 'amount', width: 14 },
      { header: '已收金额', key: 'paidAmount', width: 14 },
      { header: '生效日期', key: 'startDate', width: 14, transform: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '' },
      { header: '到期日期', key: 'endDate', width: 14, transform: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '' },
      { header: '状态', key: 'status', width: 10, transform: (v) => CONTRACT_STATUS_MAP[v] || '未知' },
    ];
    await this.excelService.exportToResponse(res, data, columns, '赞助合同', '合同数据');
  }

  async exportClients(res: Response, query: any) {
    const qb = this.clientRepo.createQueryBuilder('c').where('c.deleted_at IS NULL');
    if (query.orgId) qb.andWhere('c.org_id = :o', { o: query.orgId });
    const data = await qb.orderBy('c.created_at', 'DESC').getMany();

    const columns: ExcelColumn[] = [
      { header: '公司名称', key: 'companyName', width: 25 },
      { header: '联系人', key: 'contactPerson', width: 12 },
      { header: '联系电话', key: 'contactPhone', width: 15 },
      { header: '品类', key: 'category', width: 15 },
      { header: '意向金额', key: 'intendedAmount', width: 14 },
      { header: '是否转总部', key: 'isReferredToHq', width: 12, transform: (v) => v ? '是' : '否' },
    ];
    await this.excelService.exportToResponse(res, data, columns, '客户列表', '客户数据');
  }

  async exportEvents(res: Response, query: any) {
    const qb = this.eventRepo.createQueryBuilder('e').where('e.deleted_at IS NULL');
    if (query.orgId) qb.andWhere('e.org_id = :o', { o: query.orgId });
    const data = await qb.orderBy('e.event_date', 'DESC').getMany();

    const columns: ExcelColumn[] = [
      { header: '赛事编号', key: 'eventCode', width: 16 },
      { header: '赛事名称', key: 'eventName', width: 25 },
      { header: '赛事类型', key: 'eventType', width: 12 },
      { header: '赛事日期', key: 'eventDate', width: 14, transform: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '' },
      { header: '场馆', key: 'venue', width: 20 },
      { header: '预计参赛', key: 'expectedParticipants', width: 10 },
      { header: '负责人', key: 'directorName', width: 12 },
      { header: '进度(%)', key: 'overallProgress', width: 10 },
      { header: '状态', key: 'status', width: 10, transform: (v) => EVENT_STATUS_MAP[v] || '未知' },
    ];
    await this.excelService.exportToResponse(res, data, columns, '赛事列表', '赛事数据');
  }

  async exportBudgets(res: Response, query: any) {
    const qb = this.budgetRepo.createQueryBuilder('b').where('b.deleted_at IS NULL');
    if (query.orgId) qb.andWhere('b.org_id = :o', { o: query.orgId });
    const data = await qb.orderBy('b.created_at', 'DESC').getMany();

    const columns: ExcelColumn[] = [
      { header: '赛事名称', key: 'eventName', width: 25 },
      { header: '总预算', key: 'totalBudget', width: 14 },
      { header: '已使用', key: 'usedAmount', width: 14 },
      { header: '剩余', key: 'remainingAmount', width: 14 },
      { header: '使用率(%)', key: 'usedAmount', width: 12, transform: (v, row) => {
        const total = Number(row.totalBudget) || 1;
        return ((Number(v) / total) * 100).toFixed(1);
      }},
      { header: '状态', key: 'status', width: 10, transform: (v) => BUDGET_STATUS_MAP[v] || '未知' },
    ];
    await this.excelService.exportToResponse(res, data, columns, '预算列表', '预算数据');
  }

  async exportSettlements(res: Response, query: any) {
    const qb = this.settlementRepo.createQueryBuilder('s').where('s.deleted_at IS NULL');
    if (query.orgId) qb.andWhere('s.org_id = :o', { o: query.orgId });
    const data = await qb.orderBy('s.created_at', 'DESC').getMany();

    const columns: ExcelColumn[] = [
      { header: '账单编号', key: 'billNo', width: 18 },
      { header: '期间', key: 'period', width: 12 },
      { header: '总收入', key: 'totalRevenue', width: 14 },
      { header: '提成比例(%)', key: 'commissionRate', width: 12 },
      { header: '提成金额', key: 'commissionAmount', width: 14 },
      { header: '状态', key: 'status', width: 10, transform: (v) => SETTLEMENT_STATUS_MAP[v] || '未知' },
      { header: '创建时间', key: 'createdAt', width: 20, transform: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '' },
    ];
    await this.excelService.exportToResponse(res, data, columns, '清算账单', '清算数据');
  }

  // ========== 导入模板 ==========

  async templateExperts(res: Response) {
    const columns: ExcelColumn[] = [
      { header: '姓名', key: 'name', width: 12 },
      { header: '类型(JUDGE/VET/BEHAVIOR/OTHER)', key: 'expertType', width: 28 },
      { header: '星级(1-5)', key: 'starLevel', width: 10 },
      { header: '性别(0未知/1男/2女)', key: 'gender', width: 18 },
      { header: '手机', key: 'phone', width: 15 },
      { header: '邮箱', key: 'email', width: 22 },
      { header: '国籍', key: 'nationality', width: 12 },
      { header: '简介', key: 'bio', width: 30 },
    ];
    await this.excelService.generateTemplate(res, columns, '专家导入模板', '专家导入模板');
  }

  async templateCertificates(res: Response) {
    const columns: ExcelColumn[] = [
      { header: '证书类型(expert/judge/committee/local/other)', key: 'certType', width: 38 },
      { header: '持证人姓名', key: 'holderName', width: 14 },
      { header: '证书名称', key: 'certName', width: 22 },
      { header: '证书编号', key: 'certNo', width: 18 },
      { header: '发证机构', key: 'issuingAuthority', width: 22 },
      { header: '颁发日期(YYYY-MM-DD)', key: 'issueDate', width: 20 },
      { header: '到期日期(YYYY-MM-DD)', key: 'expiryDate', width: 20 },
    ];
    await this.excelService.generateTemplate(res, columns, '证书导入模板', '证书导入模板');
  }

  async templateRevenues(res: Response) {
    const columns: ExcelColumn[] = [
      { header: '付款方', key: 'payerName', width: 22 },
      { header: '金额', key: 'amount', width: 14 },
      { header: '收款类型(SPONSOR/ENTRY_FEE/OTHER)', key: 'revenueType', width: 32 },
      { header: '收款日期(YYYY-MM-DD)', key: 'revenueDate', width: 20 },
    ];
    await this.excelService.generateTemplate(res, columns, '收款导入模板', '收款导入模板');
  }

  // ========== 导入 ==========

  async importExperts(buffer: Buffer) {
    const columns: ExcelColumn[] = [
      { header: '姓名', key: 'name' },
      { header: '类型(JUDGE/VET/BEHAVIOR/OTHER)', key: 'expertType' },
      { header: '星级(1-5)', key: 'starLevel' },
      { header: '性别(0未知/1男/2女)', key: 'gender' },
      { header: '手机', key: 'phone' },
      { header: '邮箱', key: 'email' },
      { header: '国籍', key: 'nationality' },
      { header: '简介', key: 'bio' },
    ];
    const rows = await this.excelService.parseExcel(buffer, columns);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.name) { errors.push(`第${i + 2}行: 姓名不能为空`); failed++; continue; }
        if (!row.expertType) { errors.push(`第${i + 2}行: 类型不能为空`); failed++; continue; }
        const expert = this.expertRepo.create({
          name: String(row.name),
          expertType: String(row.expertType),
          starLevel: Number(row.starLevel) || 3,
          gender: Number(row.gender) || 0,
          phone: row.phone ? String(row.phone) : null,
          email: row.email ? String(row.email) : null,
          nationality: row.nationality ? String(row.nationality) : null,
          bio: row.bio ? String(row.bio) : null,
        });
        await this.expertRepo.save(expert);
        success++;
      } catch (e: any) {
        errors.push(`第${i + 2}行: ${e.message}`);
        failed++;
      }
    }
    return { total: rows.length, success, failed, errors: errors.slice(0, 20) };
  }

  async importCertificates(buffer: Buffer) {
    const columns: ExcelColumn[] = [
      { header: '证书类型(expert/judge/committee/local/other)', key: 'certType' },
      { header: '持证人姓名', key: 'holderName' },
      { header: '证书名称', key: 'certName' },
      { header: '证书编号', key: 'certNo' },
      { header: '发证机构', key: 'issuingAuthority' },
      { header: '颁发日期(YYYY-MM-DD)', key: 'issueDate' },
      { header: '到期日期(YYYY-MM-DD)', key: 'expiryDate' },
    ];
    const rows = await this.excelService.parseExcel(buffer, columns);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.certName) { errors.push(`第${i + 2}行: 证书名称不能为空`); failed++; continue; }
        const cert = this.certRepo.create({
          certType: row.certType || 'other',
          holderName: row.holderName ? String(row.holderName) : null,
          certName: String(row.certName),
          certNo: row.certNo ? String(row.certNo) : null,
          issuingAuthority: row.issuingAuthority ? String(row.issuingAuthority) : null,
          issueDate: row.issueDate ? new Date(row.issueDate) : null,
          expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
        });
        await this.certRepo.save(cert);
        success++;
      } catch (e: any) {
        errors.push(`第${i + 2}行: ${e.message}`);
        failed++;
      }
    }
    return { total: rows.length, success, failed, errors: errors.slice(0, 20) };
  }

  async importRevenues(buffer: Buffer) {
    const columns: ExcelColumn[] = [
      { header: '付款方', key: 'payerName' },
      { header: '金额', key: 'amount' },
      { header: '收款类型(SPONSOR/ENTRY_FEE/OTHER)', key: 'revenueType' },
      { header: '收款日期(YYYY-MM-DD)', key: 'revenueDate' },
    ];
    const rows = await this.excelService.parseExcel(buffer, columns);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.payerName) { errors.push(`第${i + 2}行: 付款方不能为空`); failed++; continue; }
        if (!row.amount) { errors.push(`第${i + 2}行: 金额不能为空`); failed++; continue; }
        const amount = Number(row.amount);
        const hqRate = 20;
        const record = this.revenueRepo.create({
          revenueNo: `RV${Date.now()}${i}`,
          payerName: String(row.payerName),
          amount,
          revenueType: row.revenueType || 'OTHER',
          revenueDate: row.revenueDate ? new Date(row.revenueDate) : new Date(),
          hqCommissionRate: hqRate,
          hqCommissionAmount: amount * hqRate / 100,
        });
        await this.revenueRepo.save(record);
        success++;
      } catch (e: any) {
        errors.push(`第${i + 2}行: ${e.message}`);
        failed++;
      }
    }
    return { total: rows.length, success, failed, errors: errors.slice(0, 20) };
  }
}
