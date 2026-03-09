import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** 通用审批记录 */
@Entity('biz_approval_record')
export class ApprovalRecord extends BaseEntity {
  @Column({ name: 'biz_type', type: 'varchar', length: 50, comment: '业务类型: BRANCH_APP/BUDGET/EXPENSE/OVER_BUDGET' })
  bizType: string;

  @Column({ name: 'biz_id', type: 'uuid', comment: '关联业务ID' })
  bizId: string;

  @Column({ name: 'step', type: 'smallint', comment: '审批步骤序号' })
  step: number;

  @Column({ name: 'step_name', type: 'varchar', length: 50, comment: '步骤名称(初审/复审/终审)' })
  stepName: string;

  @Column({ name: 'approver_id', type: 'uuid', comment: '审批人ID' })
  approverId: string;

  @Column({ name: 'approver_name', type: 'varchar', length: 50, comment: '审批人姓名' })
  approverName: string;

  @Column({ type: 'smallint', default: 0, comment: '结果: 0=待处理 1=通过 2=拒绝 3=退回' })
  result: number;

  @Column({ type: 'text', nullable: true, comment: '审批意见' })
  opinion: string;
}
