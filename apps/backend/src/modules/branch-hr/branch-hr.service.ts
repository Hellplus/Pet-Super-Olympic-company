import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchApplication } from './entities/branch-application.entity';
import { ApprovalRecord } from './entities/approval-record.entity';
import { Expert } from './entities/expert.entity';
import { ExpertCertificate } from './entities/expert-certificate.entity';
import { ExpertAssignment } from './entities/expert-assignment.entity';
import { CreateBranchApplicationDto, ApproveBranchDto, QueryBranchApplicationDto } from './dto/branch-application.dto';
import { CreateExpertDto, UpdateExpertDto, QueryExpertDto } from './dto/expert.dto';
import { paginate } from '../../common/utils/pagination.util';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';

@Injectable()
export class BranchHrService {
  constructor(
    @InjectRepository(BranchApplication) private readonly appRepo: Repository<BranchApplication>,
    @InjectRepository(ApprovalRecord) private readonly approvalRepo: Repository<ApprovalRecord>,
    @InjectRepository(Expert) private readonly expertRepo: Repository<Expert>,
    @InjectRepository(ExpertCertificate) private readonly certRepo: Repository<ExpertCertificate>,
    @InjectRepository(ExpertAssignment) private readonly assignRepo: Repository<ExpertAssignment>,
    private readonly orgService: OrganizationService,
    private readonly userService: UserService,
  ) {}

  // ====== 分会入驻申请 ======
  async createApplication(dto: CreateBranchApplicationDto) {
    return this.appRepo.save(this.appRepo.create(dto));
  }

  async findAllApplications(query: QueryBranchApplicationDto) {
    const qb = this.appRepo.createQueryBuilder('entity');
    if (query.branchName) qb.andWhere('entity.branch_name LIKE :n', { n: `%${query.branchName}%` });
    if (query.status !== undefined) qb.andWhere('entity.status = :s', { s: query.status });
    qb.orderBy('entity.created_at', 'DESC');
    return paginate(qb, query);
  }

  async findApplicationById(id: string) {
    const app = await this.appRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('申请不存在');
    return app;
  }

  async approveApplication(id: string, dto: ApproveBranchDto, approverId: string, approverName: string) {
    const app = await this.findApplicationById(id);
    const stepMap: Record<number, { next: number; stepName: string }> = {
      0: { next: 1, stepName: '初审' },
      1: { next: 2, stepName: '复审' },
      2: { next: 3, stepName: '终审' },
    };
    const step = stepMap[app.status];
    if (!step) throw new BadRequestException('当前状态不可审批');

    // 保存审批记录
    await this.approvalRepo.save(this.approvalRepo.create({
      bizType: 'BRANCH_APP', bizId: id,
      step: app.status + 1, stepName: step.stepName,
      approverId, approverName,
      result: dto.result, opinion: dto.opinion,
    }));

    if (dto.result === 1) {
      app.status = step.next;
      // 终审通过 → 自动创建分会组织节点 + 初始会长账号
      if (step.next === 3) {
        await this.autoProvisionBranch(app, approverId);
      }
    } else {
      app.status = 9;
      app.rejectReason = dto.rejectReason || dto.opinion || '';
    }
    return this.appRepo.save(app);
  }

  async getApprovalRecords(bizType: string, bizId: string) {
    return this.approvalRepo.find({ where: { bizType, bizId }, order: { step: 'ASC' } });
  }

  // ====== 专家库 ======
  async createExpert(dto: CreateExpertDto) {
    return this.expertRepo.save(this.expertRepo.create(dto));
  }

  async updateExpert(id: string, dto: UpdateExpertDto) {
    const expert = await this.expertRepo.findOne({ where: { id } });
    if (!expert) throw new NotFoundException('专家不存在');
    Object.assign(expert, dto);
    return this.expertRepo.save(expert);
  }

  async removeExpert(id: string) {
    const expert = await this.expertRepo.findOne({ where: { id } });
    if (!expert) throw new NotFoundException('专家不存在');
    return this.expertRepo.softRemove(expert);
  }

  async findAllExperts(query: QueryExpertDto) {
    const qb = this.expertRepo.createQueryBuilder('entity');
    if (query.name) qb.andWhere('entity.name LIKE :n', { n: `%${query.name}%` });
    if (query.expertType) qb.andWhere('entity.expert_type = :t', { t: query.expertType });
    if (query.starLevel) qb.andWhere('entity.star_level >= :s', { s: query.starLevel });
    return paginate(qb, query);
  }

  async findExpertById(id: string) {
    const expert = await this.expertRepo.findOne({ where: { id } });
    if (!expert) throw new NotFoundException('专家不存在');
    return expert;
  }

  // ====== 专家证书 ======
  async addCertificate(expertId: string, data: Partial<ExpertCertificate>) {
    return this.certRepo.save(this.certRepo.create({ ...data, expertId }));
  }

  async getExpertCertificates(expertId: string) {
    return this.certRepo.find({ where: { expertId }, order: { expiryDate: 'ASC' } });
  }

  async removeCertificate(id: string) {
    return this.certRepo.softRemove(await this.certRepo.findOneOrFail({ where: { id } }));
  }

  // ====== 专家调派 ======
  async getExpertAssignments(expertId: string) {
    return this.assignRepo.find({ where: { expertId }, order: { assignDate: 'DESC' } });
  }

  async createAssignment(data: Partial<ExpertAssignment>) {
    return this.assignRepo.save(this.assignRepo.create(data));
  }

  /**
   * 终审通过后自动建档：创建分会组织节点 + 下发初始会长账号
   */
  private async autoProvisionBranch(app: BranchApplication, approverId: string) {
    try {
      // 1. 查找总部根节点作为父组织
      const trees = await this.orgService.getTree();
      const rootOrg = trees?.[0];
      if (!rootOrg) return;

      const branchCode = 'BR_' + Date.now().toString(36).toUpperCase();

      // 2. 自动创建分会组织节点
      const newOrg = await this.orgService.create({
        name: app.branchName,
        code: branchCode,
        parentId: rootOrg.id,
        orgType: 2, // 2=分会
        leader: app.applicantName,
        phone: app.applicantPhone,
        address: app.city,
      }, approverId);

      // 3. 自动创建初始会长账号
      const initialPassword = 'ipoc@' + branchCode.slice(-6);
      await this.userService.create({
        username: branchCode.toLowerCase(),
        password: initialPassword,
        realName: app.applicantName,
        phone: app.applicantPhone,
        organizationId: newOrg.id,
      }, approverId);

      // 4. 回写分会ID到申请记录
      app.remark = `自动建档成功 | 组织ID: ${newOrg.id} | 初始账号: ${branchCode.toLowerCase()} | 初始密码: ${initialPassword}`;
    } catch (e) {
      app.remark = `自动建档失败: ${e.message}`;
    }
  }

  async rateAssignment(id: string, rating: number, reviewComment: string) {
    const a = await this.assignRepo.findOneOrFail({ where: { id } });
    a.rating = rating;
    a.reviewComment = reviewComment;
    a.status = 2;
    return this.assignRepo.save(a);
  }

  // ====== 全量证书管理 ======
  async createCertificate(data: Partial<ExpertCertificate>) {
    return this.certRepo.save(this.certRepo.create(data));
  }

  async findAllCertificates(query: { expertId?: string; certType?: string; keyword?: string; status?: string; page?: number; pageSize?: number }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    const where: any = {};
    if (query.expertId) where.expertId = query.expertId;
    if (query.certType) where.certType = query.certType;

    const [allItems, total] = await this.certRepo.findAndCount({
      where,
      order: { expiryDate: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 手动加载专家信息（仅对有 expertId 的证书）
    const expertIds = [...new Set(allItems.map(c => c.expertId).filter(Boolean))];
    const experts = expertIds.length > 0
      ? await this.expertRepo.findByIds(expertIds)
      : [];
    const expertMap = new Map(experts.map(e => [e.id, e]));

    let items = allItems.map(c => ({
      ...c,
      expert: c.expertId && expertMap.get(c.expertId) ? {
        id: expertMap.get(c.expertId)!.id,
        name: expertMap.get(c.expertId)!.name,
        expertType: expertMap.get(c.expertId)!.expertType,
      } : null,
    }));

    if (query.keyword) {
      const k = query.keyword.toLowerCase();
      items = items.filter(c =>
        c.certName?.toLowerCase().includes(k) ||
        c.certNo?.toLowerCase().includes(k) ||
        c.issuingAuthority?.toLowerCase().includes(k) ||
        c.holderName?.toLowerCase().includes(k)
      );
    }
    if (query.status === 'expired') {
      items = items.filter(c => c.expiryDate && new Date(c.expiryDate) < new Date());
    } else if (query.status === 'expiring') {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + 30);
      items = items.filter(c => c.expiryDate && new Date(c.expiryDate) >= now && new Date(c.expiryDate) <= future);
    } else if (query.status === 'valid') {
      items = items.filter(c => !c.expiryDate || new Date(c.expiryDate) > new Date());
    }

    return { items, total, page, pageSize };
  }

  async updateCertificate(id: string, data: Partial<ExpertCertificate>) {
    const cert = await this.certRepo.findOne({ where: { id } });
    if (!cert) throw new NotFoundException('证书不存在');
    Object.assign(cert, data);
    return this.certRepo.save(cert);
  }

  // ====== 专家资质到期预警 ======
  /** PRD: "资质证书(带到期预警)" - 查询即将到期和已过期的证书 */
  async getCertExpiryWarnings(daysAhead = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // 避免 leftJoinAndSelect 导致 databaseName 错误，使用 find 替代
    const allCerts = await this.certRepo.find({
      where: { isExpired: false },
      order: { expiryDate: 'ASC' },
    });

    // 筛选有到期日期且在预警范围内的证书
    const futureDateStr = futureDate.toISOString().slice(0, 10);
    const certs = allCerts.filter(c =>
      c.expiryDate && new Date(c.expiryDate).toISOString().slice(0, 10) <= futureDateStr
    );

    // 手动加载专家信息
    const expertIds = [...new Set(certs.map(c => c.expertId).filter(Boolean))];
    const experts = expertIds.length > 0
      ? await this.expertRepo.findByIds(expertIds)
      : [];
    const expertMap = new Map(experts.map(e => [e.id, e]));

    const expired = certs.filter(c => new Date(c.expiryDate) < now);
    const expiringSoon = certs.filter(c => new Date(c.expiryDate) >= now);

    // 自动标记已过期
    for (const c of expired) {
      if (!c.isExpired) {
        await this.certRepo.update(c.id, { isExpired: true });
      }
    }

    return {
      daysAhead,
      expiredCount: expired.length,
      expiringSoonCount: expiringSoon.length,
      expired: expired.map(c => ({
        certId: c.id, certName: c.certName, certNo: c.certNo,
        expertId: c.expertId, expertName: expertMap.get(c.expertId)?.name,
        expiryDate: c.expiryDate, issuingAuthority: c.issuingAuthority,
      })),
      expiringSoon: expiringSoon.map(c => ({
        certId: c.id, certName: c.certName, certNo: c.certNo,
        expertId: c.expertId, expertName: expertMap.get(c.expertId)?.name,
        expiryDate: c.expiryDate, issuingAuthority: c.issuingAuthority,
        daysRemaining: Math.ceil((new Date(c.expiryDate).getTime() - now.getTime()) / 86400000),
      })),
    };
  }

  /** 跨区调派搜索 - PRD: "支持全国分会跨区调派检索" */
  async searchExpertsForDispatch(query: { expertType?: string; starLevel?: number; keyword?: string }) {
    const qb = this.expertRepo.createQueryBuilder('e')
      .where('e.status = 1')
      .andWhere('e.deleted_at IS NULL');
    if (query.expertType) qb.andWhere('e.expert_type = :t', { t: query.expertType });
    if (query.starLevel) qb.andWhere('e.star_level >= :s', { s: query.starLevel });
    if (query.keyword) qb.andWhere('(e.name LIKE :k OR e.specialties LIKE :k)', { k: `%${query.keyword}%` });
    qb.orderBy('e.star_level', 'DESC').addOrderBy('e.total_assignments', 'DESC');
    return qb.getMany();
  }
}
