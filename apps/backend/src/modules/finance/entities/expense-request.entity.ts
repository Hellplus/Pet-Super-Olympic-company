import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { EventBudget } from './event-budget.entity';

/** 报销/付款申请单 */
@Entity('biz_expense_request')
export class ExpenseRequest extends BaseEntity {
  @Column({ name: 'expense_no', type: 'varchar', length: 50, unique: true, comment: '单据编号' })
  expenseNo: string;

  @Column({ name: 'org_id', type: 'uuid' })
  @Index('idx_expense_org')
  orgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'budget_id', type: 'uuid', nullable: true, comment: '关联预算包ID' })
  budgetId: string;

  @ManyToOne(() => EventBudget)
  @JoinColumn({ name: 'budget_id' })
  budget: EventBudget;

  @Column({ name: 'budget_subject', type: 'varchar', length: 100, nullable: true, comment: '关联预算科目' })
  budgetSubject: string;

  @Column({ name: 'expense_type', type: 'varchar', length: 50, comment: '费用类型: REIMBURSE/PAYMENT' })
  expenseType: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, comment: '申请金额' })
  amount: number;

  @Column({ type: 'text', nullable: true, comment: '摘要/用途说明' })
  description: string;

  @Column({ name: 'applicant_id', type: 'uuid', comment: '申请人ID' })
  applicantId: string;

  @Column({ name: 'applicant_name', type: 'varchar', length: 50, comment: '申请人' })
  applicantName: string;

  @Column({ type: 'smallint', default: 0, comment: '0草稿 1待审批 2审批中 3已通过 4已驳回 5已付款 6已核销' })
  status: number;

  @Column({ name: 'payment_voucher_url', type: 'varchar', length: 500, nullable: true, comment: '银行回单截图' })
  paymentVoucherUrl: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true, comment: '出纳确认付款时间' })
  paidAt: Date;

  @Column({ name: 'is_over_budget', type: 'boolean', default: false, comment: '是否超预算申请' })
  isOverBudget: boolean;

  @Column({ name: 'attachments', type: 'jsonb', nullable: true, comment: '附件列表 [{name,url}]' })
  attachments: any;
}
