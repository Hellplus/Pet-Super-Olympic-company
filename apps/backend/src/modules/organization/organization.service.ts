import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrgDto, UpdateOrgDto, MoveOrgDto } from './dto/organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async create(dto: CreateOrgDto, currentUserId: string): Promise<Organization> {
    const existing = await this.orgRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('组织编码已存在');

    return this.entityManager.transaction(async (manager) => {
      const org = manager.create(Organization, dto);

      if (dto.parentId) {
        const parent = await manager.findOne(Organization, { where: { id: dto.parentId } });
        if (!parent) throw new NotFoundException('父组织不存在');
        org.parent = parent;
        org.depth = parent.depth + 1;
        org.treePath = `${parent.treePath}.${dto.code}`;
      } else {
        org.depth = 1;
        org.treePath = dto.code;
      }

      org.createdBy = currentUserId;
      return manager.save(Organization, org);
    });
  }

  async update(id: string, dto: UpdateOrgDto, currentUserId: string) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('组织不存在');

    Object.assign(org, dto, { updatedBy: currentUserId });
    return this.orgRepo.save(org);
  }

  async remove(id: string) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('组织不存在');

    // 检查是否有子节点
    const children = await this.orgRepo.find({ where: { parentId: id } });
    if (children.length > 0) {
      throw new BadRequestException('请先删除所有子组织');
    }

    return this.orgRepo.softRemove(org);
  }

  async getTree(): Promise<Organization[]> {
    const treeRepo = this.orgRepo.manager.getTreeRepository(Organization);
    return treeRepo.findTrees({ depth: 10 });
  }

  async getChildren(parentId: string): Promise<Organization[]> {
    return this.orgRepo.find({
      where: { parentId, status: 1 },
      order: { sortOrder: 'ASC' },
    });
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('组织不存在');
    return org;
  }

  async moveNode(dto: MoveOrgDto, currentUserId: string): Promise<void> {
    return this.entityManager.transaction(async (manager) => {
      const node = await manager.findOne(Organization, { where: { id: dto.nodeId } });
      if (!node) throw new NotFoundException('节点不存在');

      const newParent = await manager.findOne(Organization, { where: { id: dto.newParentId } });
      if (!newParent) throw new NotFoundException('目标父节点不存在');

      // 防循环检测
      if (newParent.treePath.startsWith(node.treePath)) {
        throw new BadRequestException('不能将节点移动到自己的子节点下');
      }

      const oldPath = node.treePath;
      const newPath = `${newParent.treePath}.${node.code}`;

      // 批量更新后代节点的treePath
      await manager.query(
        `UPDATE sys_organization
         SET tree_path = $1 || SUBSTRING(tree_path FROM $2),
             depth = depth + ($3 - $4),
             updated_by = $5,
             updated_at = NOW()
         WHERE tree_path LIKE $6`,
        [newPath, oldPath.length + 1, newParent.depth + 1, node.depth, currentUserId, `${oldPath}.%`],
      );

      // 更新节点自身
      node.parentId = dto.newParentId;
      node.treePath = newPath;
      node.depth = newParent.depth + 1;
      node.updatedBy = currentUserId;
      await manager.save(Organization, node);
    });
  }

  async getDescendantIds(orgId: string): Promise<string[]> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) return [];

    const descendants = await this.orgRepo
      .createQueryBuilder('org')
      .select('org.id')
      .where('org.tree_path LIKE :path', { path: `${org.treePath}%` })
      .getMany();
    return descendants.map((d) => d.id);
  }

  /**
   * 一键熔断分会 — PRD"一键撤销"
   * 1. 禁用该分会组织节点
   * 2. 冻结该分会下所有子组织
   * 3. 冻结该分会下所有用户账号（踢下线+失效）
   * 4. 封存历史数据（保留不删除）
   */
  async meltdownOrg(id: string, reason?: string): Promise<{ frozenOrgCount: number; frozenUserCount: number }> {
    // 获取该组织及所有后代组织ID
    const allOrgIds = await this.getDescendantIds(id);
    if (allOrgIds.length === 0) {
      throw new NotFoundException('组织不存在');
    }

    // 1. 批量冻结所有组织节点
    const frozenOrgResult = await this.orgRepo
      .createQueryBuilder()
      .update(Organization)
      .set({ status: 0, remark: reason ? `[熔断] ${reason}` : '[熔断] 总部一键撤销' })
      .where('id IN (:...ids)', { ids: allOrgIds })
      .execute();

    // 2. 批量冻结所有用户账号
    const frozenUserResult = await this.entityManager
      .createQueryBuilder()
      .update('sys_user')
      .set({ status: 0 })
      .where('organization_id IN (:...ids)', { ids: allOrgIds })
      .andWhere('is_super_admin = false')
      .execute();

    return {
      frozenOrgCount: frozenOrgResult.affected || 0,
      frozenUserCount: frozenUserResult.affected || 0,
    };
  }
}
