import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../organization/entities/organization.entity';

/** 待上缴清算账单 */
@Entity('biz_settlement_bill')
export class SettlementBill extends BaseEntity {
  @Column({ name: 'org_id', type: 'uuid', comment: '分会ID' })
  orgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'bill_no', type: 'varchar', length: 50, unique: true, comment: '清算单号' })
  billNo: string;

  @Column({ name: 'period', type: 'varchar', length: 20, comment: '账期 如 2026-Q1' })
  period: string;

  @Column({ name: 'total_revenue', type: 'decimal', precision: 14, scale: 2, comment: '本期总收入' })
  totalRevenue: number;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, comment: '抽成比例' })
  commissionRate: number;

  @Column({ name: 'commission_amount', type: 'decimal', precision: 14, scale: 2, comment: '应上缴金额' })
  commissionAmount: number;

  @Column({ type: 'smallint', default: 0, comment: '0待确认 1已确认 2已催缴 3已缴纳 4已核销' })
  status: number;

  @Column({ name: 'payment_voucher_url', type: 'varchar', length: 500, nullable: true, comment: '缴款凭证' })
  paymentVoucherUrl: string;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true, comment: '核销时间' })
  confirmedAt: Date;
}
