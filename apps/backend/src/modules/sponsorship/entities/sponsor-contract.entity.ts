import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { SponsorClient } from './sponsor-client.entity';

/** 赞助合同 */
@Entity('biz_sponsor_contract')
export class SponsorContract extends BaseEntity {
  @Column({ name: 'contract_no', type: 'varchar', length: 50, unique: true, comment: '合同编号' })
  contractNo: string;

  @Column({ name: 'org_id', type: 'uuid' })
  @Index('idx_contract_org')
  orgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => SponsorClient)
  @JoinColumn({ name: 'client_id' })
  client: SponsorClient;

  @Column({ name: 'sponsor_level', type: 'varchar', length: 50, comment: '赞助级别: TITLE/GOLD/SILVER/OTHER' })
  sponsorLevel: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, comment: '合同金额' })
  amount: number;

  @Column({ name: 'paid_amount', type: 'decimal', precision: 14, scale: 2, default: 0, comment: '已收款' })
  paidAmount: number;

  @Column({ name: 'start_date', type: 'date', comment: '生效日期' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', comment: '到期日期' })
  endDate: Date;

  @Column({ name: 'rights_desc', type: 'text', nullable: true, comment: '权益描述(JSON)' })
  rightsDesc: string;

  @Column({ name: 'contract_file_url', type: 'varchar', length: 500, nullable: true, comment: '合同扫描件' })
  contractFileUrl: string;

  @Column({ type: 'smallint', default: 0, comment: '0草稿 1生效 2已完结 3已终止' })
  status: number;
}
