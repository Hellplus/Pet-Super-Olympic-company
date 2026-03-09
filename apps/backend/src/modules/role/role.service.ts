import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto, AssignPermissionsDto } from './dto/role.dto';
import { paginate } from '../../common/utils/pagination.util';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(RolePermission) private readonly rpRepo: Repository<RolePermission>,
  ) {}

  async create(dto: CreateRoleDto, currentUserId: string) {
    const existing = await this.roleRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('角色编码已存在');

    const role = this.roleRepo.create({ ...dto, createdBy: currentUserId });
    return this.roleRepo.save(role);
  }

  async update(id: string, dto: UpdateRoleDto, currentUserId: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('角色不存在');
    if (role.isSystem) throw new BadRequestException('系统内置角色不可修改');

    Object.assign(role, dto, { updatedBy: currentUserId });
    return this.roleRepo.save(role);
  }

  async remove(id: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('角色不存在');
    if (role.isSystem) throw new BadRequestException('系统内置角色不可删除');
    return this.roleRepo.softRemove(role);
  }

  async findAll(query: QueryRoleDto) {
    const qb = this.roleRepo.createQueryBuilder('entity');

    if (query.name) {
      qb.andWhere('entity.name LIKE :name', { name: `%${query.name}%` });
    }
    if (query.code) {
      qb.andWhere('entity.code LIKE :code', { code: `%${query.code}%` });
    }
    if (query.status !== undefined) {
      qb.andWhere('entity.status = :status', { status: query.status });
    }

    return paginate(qb, query);
  }

  async findById(id: string) {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  async assignPermissions(id: string, dto: AssignPermissionsDto, currentUserId: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('角色不存在');

    // 删除旧的权限关联
    await this.rpRepo.delete({ roleId: id });

    // 创建新的权限关联
    const rolePermissions = dto.permissionIds.map((permId) =>
      this.rpRepo.create({ roleId: id, permissionId: permId, createdBy: currentUserId }),
    );
    await this.rpRepo.save(rolePermissions);

    return { message: '权限分配成功' };
  }

  async getRolePermissionIds(id: string): Promise<string[]> {
    const rps = await this.rpRepo.find({ where: { roleId: id } });
    return rps.map((rp) => rp.permissionId);
  }
}
