import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/permission.dto';

@Injectable()
export class PermissionService {
  constructor(@InjectRepository(Permission) private readonly permRepo: Repository<Permission>) {}

  async create(dto: CreatePermissionDto, currentUserId: string) {
    const existing = await this.permRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('权限标识已存在');
    const perm = this.permRepo.create({ ...dto, createdBy: currentUserId });
    return this.permRepo.save(perm);
  }

  async update(id: string, dto: UpdatePermissionDto, currentUserId: string) {
    const perm = await this.permRepo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException('权限不存在');
    Object.assign(perm, dto, { updatedBy: currentUserId });
    return this.permRepo.save(perm);
  }

  async remove(id: string) {
    const perm = await this.permRepo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException('权限不存在');
    const children = await this.permRepo.find({ where: { parentId: id } });
    if (children.length > 0) throw new BadRequestException('请先删除子权限');
    return this.permRepo.softRemove(perm);
  }

  async getTree(): Promise<Permission[]> {
    const treeRepo = this.permRepo.manager.getTreeRepository(Permission);
    return treeRepo.findTrees({ depth: 10 });
  }

  async findAll() { return this.permRepo.find({ order: { sortOrder: 'ASC' } }); }

  async findById(id: string) {
    const perm = await this.permRepo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException('权限不存在');
    return perm;
  }
}
