import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../organization/entities/organization.entity';

/** 收款登记单 */
@Entity('biz_revenue_record')
export class RevenueRecord extends BaseEntity {
  @Column({ name: 'org_id', type: 'uuid', comment: '所属分会ID' })
  orgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'revenue_no', type: 'varchar', length: 50, unique: true, comment: '收款单号' })
  revenueNo: string;

  @Column({ name: 'payer_name', type: 'varchar', length: 200, comment: '付款方名称' })
  payerName: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, comment: '收款金额' })
  amount: number;

  @Column({ name: 'revenue_date', type: 'date', comment: '收款日期' })
  revenueDate: Date;

  @Column({ name: 'revenue_type', type: 'varchar', length: 50, comment: '收款类型: SPONSOR/ENTRY_FEE/OTHER' })
  revenueType: string;

  @Column({ name: 'voucher_url', type: 'varchar', length: 500, nullable: true, comment: '凭证附件URL' })
  voucherUrl: string;

  @Column({ name: 'hq_commission_rate', type: 'decimal', precision: 5, scale: 2, default: 20.00, comment: '总部抽成比例(%)' })
  hqCommissionRate: number;

  @Column({ name: 'hq_commission_amount', type: 'decimal', precision: 14, scale: 2, default: 0, comment: '应上缴总部金额' })
  hqCommissionAmount: number;

  @Column({ name: 'is_settled', type: 'boolean', default: false, comment: '是否已结算上缴' })
  isSettled: boolean;

  @Column({ type: 'smallint', default: 1, comment: '状态 1正常 0作废' })
  status: number;
}
