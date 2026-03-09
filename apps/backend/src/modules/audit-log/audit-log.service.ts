import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@Injectable()
export class AuditLogService {
  constructor(@InjectRepository(AuditLog) private readonly auditLogRepo: Repository<AuditLog>) {}

  async findAll(query: QueryAuditLogDto) {
    const { page = 1, pageSize = 20, username, module: mod, action, status, startTime, endTime } = query;
    const qb = this.auditLogRepo.createQueryBuilder('log');
    if (username) qb.andWhere('log.username LIKE :username', { username: '%' + username + '%' });
    if (mod) qb.andWhere('log.module = :module', { module: mod });
    if (action) qb.andWhere('log.action = :action', { action });
    if (status !== undefined) qb.andWhere('log.status = :status', { status });
    if (startTime) qb.andWhere('log.created_at >= :startTime', { startTime });
    if (endTime) qb.andWhere('log.created_at <= :endTime', { endTime });
    qb.orderBy('log.created_at', 'DESC');
    const [items, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findById(id: string) {
    const log = await this.auditLogRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('日志不存在');
    return log;
  }

  async create(data: Partial<AuditLog>) {
    return this.auditLogRepo.save(this.auditLogRepo.create(data));
  }
}
