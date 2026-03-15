import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProtectedCategory } from './entities/protected-category.entity';
import { SponsorClient } from './entities/sponsor-client.entity';
import { SponsorContract } from './entities/sponsor-contract.entity';
import { DeliveryTask } from './entities/delivery-task.entity';
import { CreateProtectedCategoryDto, CreateSponsorClientDto, CreateSponsorContractDto, QueryContractDto } from './dto/sponsorship.dto';
import { paginate } from '../../common/utils/pagination.util';

@Injectable()
export class SponsorshipService {
  constructor(
    @InjectRepository(ProtectedCategory) private readonly catRepo: Repository<ProtectedCategory>,
    @InjectRepository(SponsorClient) private readonly clientRepo: Repository<SponsorClient>,
    @InjectRepository(SponsorContract) private readonly contractRepo: Repository<SponsorContract>,
    @InjectRepository(DeliveryTask) private readonly taskRepo: Repository<DeliveryTask>,
  ) {}

  // ====== 品类保护 ======
  async createProtectedCategory(dto: CreateProtectedCategoryDto) {
    return this.catRepo.save(this.catRepo.create(dto));
  }
  async getAllProtectedCategories() {
    return this.catRepo.find({ order: { categoryName: 'ASC' } });
  }
  async removeProtectedCategory(id: string) {
    return this.catRepo.softRemove(await this.catRepo.findOneOrFail({ where: { id } }));
  }

  /** 品类排他校验 - 前端录入时调用 */
  async checkCategoryConflict(category: string) {
    const found = await this.catRepo.findOne({ where: { categoryName: category, status: 1 } });
    return { isProtected: !!found, protectedInfo: found || null };
  }

  // ====== 客户 ======
  async createClient(dto: CreateSponsorClientDto) {
    // 品类排他校验
    if (dto.category) {
      const check = await this.checkCategoryConflict(dto.category);
      if (check.isProtected) throw new BadRequestException(`该品类"${dto.category}"已被独家保护，禁止录入!`);
    }
    return this.clientRepo.save(this.clientRepo.create(dto));
  }
  async findAllClients(orgId?: string) {
    const qb = this.clientRepo.createQueryBuilder('entity').leftJoinAndSelect('entity.organization', 'org');
    if (orgId) qb.where('entity.org_id = :o', { o: orgId });
    qb.orderBy('entity.created_at', 'DESC');
    return qb.getMany();
  }
  async updateClient(id: string, data: any) {
    const client = await this.clientRepo.findOne({ where: { id } });
    if (!client) throw new NotFoundException('客户不存在');
    // 兼容新旧两套字段名
    if (data.companyName || data.clientName) client.companyName = data.companyName || data.clientName;
    if (data.contactPerson || data.contactName) client.contactPerson = data.contactPerson || data.contactName;
    if (data.contactPhone !== undefined) client.contactPhone = data.contactPhone;
    if (data.category !== undefined || data.industry !== undefined) client.category = data.category ?? data.industry;
    if (data.intendedAmount !== undefined || data.intentAmount !== undefined) client.intendedAmount = data.intendedAmount ?? data.intentAmount;
    if (data.isReferredToHq !== undefined || data.referToHq !== undefined) client.isReferredToHq = data.isReferredToHq ?? data.referToHq;
    if (data.email !== undefined) (client as any).email = data.email;
    if (data.remark !== undefined) (client as any).remark = data.remark;
    return this.clientRepo.save(client);
  }

  async deleteClient(id: string) {
    const client = await this.clientRepo.findOne({ where: { id } });
    if (!client) throw new NotFoundException('客户不存在');
    // 检查是否有合同关联
    const contractCount = await this.contractRepo.count({ where: { clientId: id } as any });
    if (contractCount > 0) {
      throw new BadRequestException(`该客户已关联 ${contractCount} 个合同，无法删除`);
    }
    await this.clientRepo.remove(client);
    return { success: true };
  }

  async referToHq(id: string) {
    await this.clientRepo.update(id, { isReferredToHq: true });
  }

  // ====== 合同 ======
  async createContract(dto: CreateSponsorContractDto, userId: string) {
    // PRD品类排他拦截：合同创建时，查客户品类，若受保护则拒绝
    if (dto.clientId) {
      const client = await this.clientRepo.findOne({ where: { id: dto.clientId } });
      if (client?.category) {
        const check = await this.checkCategoryConflict(client.category);
        if (check.isProtected) {
          throw new BadRequestException(
            `品类排他拦截：该客户所属品类"${client.category}"已被独家保护（品牌: ${check.protectedInfo?.brandName || ''}），禁止签约！`
          );
        }
      }
    }
    const no = 'SC' + Date.now().toString(36).toUpperCase();
    return this.contractRepo.save(this.contractRepo.create({ ...dto, contractNo: no, createdBy: userId }));
  }
  async findAllContracts(query: QueryContractDto) {
    const qb = this.contractRepo.createQueryBuilder('entity')
      .leftJoinAndSelect('entity.organization', 'org')
      .leftJoinAndSelect('entity.client', 'client');
    if (query.orgId) qb.andWhere('entity.org_id = :o', { o: query.orgId });
    if (query.status !== undefined) qb.andWhere('entity.status = :s', { s: query.status });
    qb.orderBy('entity.created_at', 'DESC');
    return paginate(qb, query);
  }
  async activateContract(id: string) {
    const c = await this.contractRepo.findOneOrFail({ where: { id } });
    c.status = 1;
    return this.contractRepo.save(c);
  }

  /** 合同权益一键拆包 */
  async decomposeRights(contractId: string, tasks: { taskName: string; taskType: string; quantity: number; eventId?: string }[]) {
    const created = tasks.map(t => this.taskRepo.create({ ...t, contractId }));
    return this.taskRepo.save(created);
  }

  // ====== 交付任务 ======
  async getDeliveryTasks(contractId: string) {
    return this.taskRepo.find({ where: { contractId }, order: { createdAt: 'ASC' } });
  }
  /** 生成赞助执行结案报告数据 */
  async generateReportData(contractId: string) {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
      relations: ['client', 'organization'],
    });
    if (!contract) throw new NotFoundException('合同不存在');

    const tasks = await this.taskRepo.find({ where: { contractId }, order: { createdAt: 'ASC' } });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 2).length;
    const totalPhotos = tasks.reduce((sum, t) => sum + (t.evidencePhotos?.length || 0), 0);

    return {
      contract: {
        contractNo: contract.contractNo,
        clientName: (contract as any).client?.clientName || '',
        orgName: (contract as any).organization?.name || '',
        amount: contract.amount,
        startDate: contract.startDate,
        endDate: contract.endDate,
      },
      summary: {
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalPhotos,
      },
      tasks: tasks.map(t => ({
        taskName: t.taskName,
        taskType: t.taskType,
        quantity: t.quantity,
        completedQuantity: t.completedQuantity,
        status: t.status,
        evidenceCount: t.evidencePhotos?.length || 0,
        evidencePhotos: t.evidencePhotos || [],
      })),
    };
  }

  async submitEvidence(taskId: string, evidencePhotos: any[], completedQty: number) {
    const task = await this.taskRepo.findOneOrFail({ where: { id: taskId } });
    task.evidencePhotos = [...(task.evidencePhotos || []), ...evidencePhotos];
    task.completedQuantity = completedQty;
    task.status = completedQty >= task.quantity ? 2 : 1;
    return this.taskRepo.save(task);
  }
}
