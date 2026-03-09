import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('sys_audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 要素1：操作人
  @Column({ name: 'user_id', type: 'uuid', nullable: true, comment: '操作人ID' })
  @Index('idx_audit_user_id')
  userId: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '操作人账号' })
  username: string;

  @Column({ name: 'real_name', type: 'varchar', length: 50, nullable: true, comment: '操作人姓名' })
  realName: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true, comment: '操作人组织ID' })
  organizationId: string;

  @Column({ name: 'organization_name', type: 'varchar', length: 100, nullable: true, comment: '操作人组织名称' })
  organizationName: string;

  // 要素2：时间
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', comment: '操作时间' })
  @Index('idx_audit_created_at')
  createdAt: Date;

  // 要素3：IP/设备
  @Column({ type: 'varchar', length: 50, nullable: true, comment: '操作IP' })
  ip: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true, comment: 'User-Agent' })
  userAgent: string;

  @Column({ name: 'request_id', type: 'varchar', length: 36, nullable: true, comment: '请求追踪ID' })
  requestId: string;

  // 操作信息
  @Column({ type: 'varchar', length: 200, comment: '操作模块' })
  module: string;

  @Column({ type: 'varchar', length: 20, comment: '操作类型' })
  @Index('idx_audit_action')
  action: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '操作描述' })
  description: string;

  @Column({ name: 'request_url', type: 'varchar', length: 200, nullable: true, comment: '请求URL' })
  requestUrl: string;

  @Column({ name: 'request_method', type: 'varchar', length: 10, nullable: true, comment: '请求方法' })
  requestMethod: string;

  @Column({ name: 'request_params', type: 'text', nullable: true, comment: '请求参数' })
  requestParams: string;

  // 要素4：操作前快照
  @Column({ name: 'before_snapshot', type: 'jsonb', nullable: true, comment: '操作前数据快照' })
  beforeSnapshot: Record<string, any>;

  // 要素5：操作后快照
  @Column({ name: 'after_snapshot', type: 'jsonb', nullable: true, comment: '操作后数据快照' })
  afterSnapshot: Record<string, any>;

  // 结果
  @Column({ type: 'smallint', default: 1, comment: '结果：1=成功 0=失败' })
  status: number;

  @Column({ name: 'error_message', type: 'text', nullable: true, comment: '错误信息' })
  errorMessage: string;

  @Column({ type: 'int', nullable: true, comment: '耗时(ms)' })
  duration: number;

  @Column({ name: 'entity_name', type: 'varchar', length: 100, nullable: true, comment: '目标实体' })
  @Index('idx_audit_entity')
  entityName: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true, comment: '目标实体ID' })
  entityId: string;
}
