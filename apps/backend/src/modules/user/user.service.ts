import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto/user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { paginate } from '../../common/utils/pagination.util';
import { applyDataScope, DataScopeContext } from '../../common/utils/data-scope-filter.util';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(dto: CreateUserDto, currentUserId: string) {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) throw new BadRequestException('账号已存在');

    const hashedPassword = await bcrypt.hash(dto.password || '123456', 10);
    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
      createdBy: currentUserId,
    });
    return this.userRepo.save(user);
  }

  async update(id: string, dto: UpdateUserDto, currentUserId: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    Object.assign(user, dto, { updatedBy: currentUserId });
    return this.userRepo.save(user);
  }

  async remove(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    if (user.isSuperAdmin) throw new BadRequestException('不能删除超级管理员');
    return this.userRepo.softRemove(user);
  }

  async findAll(query: QueryUserDto, dataScope?: DataScopeContext) {
    const qb = this.userRepo
      .createQueryBuilder('entity')
      .leftJoinAndSelect('entity.organization', 'org')
      .leftJoinAndSelect('entity.roles', 'roles');

    if (query.username) {
      qb.andWhere('entity.username LIKE :username', { username: `%${query.username}%` });
    }
    if (query.realName) {
      qb.andWhere('entity.real_name LIKE :realName', { realName: `%${query.realName}%` });
    }
    if (query.status !== undefined) {
      qb.andWhere('entity.status = :status', { status: query.status });
    }
    if (query.organizationId) {
      qb.andWhere('entity.organization_id = :orgId', { orgId: query.organizationId });
    }

    if (dataScope) {
      applyDataScope(qb, dataScope, 'entity.organization_id');
    }

    return paginate(qb, query);
  }

  async findById(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['organization', 'roles'],
    });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async findByUsername(username: string) {
    return this.userRepo.findOne({
      where: { username },
      select: [
        'id', 'username', 'password', 'realName', 'status',
        'organizationId', 'isSuperAdmin', 'loginFailCount', 'lockUntil', 'avatar',
      ],
    });
  }

  async findByIdWithPermissions(id: string) {
    // 先查缓存
    const cached = await this.cacheManager.get(`user:info:${id}`);
    if (cached) return cached;

    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['organization', 'roles', 'roles.rolePermissions', 'roles.rolePermissions.permission'],
    });
    if (!user) return null;

    // 汇总权限
    const permissions: string[] = [];
    const roles = user.roles || [];
    for (const role of roles) {
      if (role.status !== 1) continue;
      for (const rp of role.rolePermissions || []) {
        if (rp.permission?.code) {
          permissions.push(rp.permission.code);
        }
      }
    }

    const userInfo = {
      id: user.id,
      username: user.username,
      realName: user.realName,
      avatar: user.avatar,
      status: user.status,
      organizationId: user.organizationId,
      orgTreePath: user.organization?.treePath,
      isSuperAdmin: user.isSuperAdmin,
      permissions: [...new Set(permissions)],
      roles: roles.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        dataScope: r.dataScope,
      })),
    };

    // 写入缓存
    await this.cacheManager.set(`user:info:${id}`, userInfo, 3600000);
    return userInfo;
  }

  async updateLastLogin(id: string, ip: string) {
    await this.userRepo.update(id, { lastLoginAt: new Date(), lastLoginIp: ip });
  }

  async resetLoginFail(id: string) {
    await this.userRepo.update(id, { loginFailCount: 0, lockUntil: undefined as any });
  }

  async incrementLoginFail(id: string, count: number) {
    await this.userRepo.update(id, { loginFailCount: count });
  }

  async lockAccount(id: string, failCount: number, lockUntil: Date) {
    await this.userRepo.update(id, { loginFailCount: failCount, lockUntil, status: 2 });
  }

  async updatePassword(id: string, hashedPassword: string) {
    await this.userRepo.update(id, { password: hashedPassword });
  }

  /** 一键封停账号 */
  async disableUser(id: string) {
    await this.userRepo.update(id, { status: 0 });
    await this.cacheManager.del(`user:info:${id}`);
  }

  /** 启用账号 */
  async enableUser(id: string) {
    await this.userRepo.update(id, { status: 1, loginFailCount: 0, lockUntil: undefined as any });
    await this.cacheManager.del(`user:info:${id}`);
  }

  /** 分配角色 */
  async assignRoles(userId: string, roleIds: string[]) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['roles'] });
    if (!user) throw new NotFoundException('用户不存在');

    user.roles = roleIds.map((id) => ({ id } as any));
    await this.userRepo.save(user);
    await this.cacheManager.del(`user:info:${userId}`);
  }
}
