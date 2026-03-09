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
  async referToHq(id: string) {
    await this.clientRepo.update(id, { isReferredToHq: true });
  }

  // ====== 合同 ======
  async createContract(dto: CreateSponsorContractDto, userId: string) {
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
  async submitEvidence(taskId: string, evidencePhotos: any[], completedQty: number) {
    const task = await this.taskRepo.findOneOrFail({ where: { id: taskId } });
    task.evidencePhotos = [...(task.evidencePhotos || []), ...evidencePhotos];
    task.completedQuantity = completedQty;
    task.status = completedQty >= task.quantity ? 2 : 1;
    return this.taskRepo.save(task);
  }
}
