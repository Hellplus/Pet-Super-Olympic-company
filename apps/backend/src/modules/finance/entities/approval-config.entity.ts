import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** 审批金额路由配置 */
@Entity('biz_approval_config')
export class ApprovalConfig extends BaseEntity {
  @Column({ name: 'biz_type', type: 'varchar', length: 50, comment: '业务类型: EXPENSE/BUDGET' })
  bizType: string;

  @Column({ name: 'min_amount', type: 'decimal', precision: 14, scale: 2, comment: '最低金额(含)' })
  minAmount: number;

  @Column({ name: 'max_amount', type: 'decimal', precision: 14, scale: 2, nullable: true, comment: '最高金额(不含,null=无上限)' })
  maxAmount: number;

  @Column({ name: 'approval_levels', type: 'jsonb', comment: '审批级别配置 [{level,roleCodes,name}]' })
  approvalLevels: any;

  @Column({ type: 'smallint', default: 1, comment: '1启用 0停用' })
  status: number;
}
