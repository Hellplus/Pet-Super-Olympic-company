import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../organization/entities/organization.entity';

/** 赞助商客户 */
@Entity('biz_sponsor_client')
export class SponsorClient extends BaseEntity {
  @Column({ name: 'org_id', type: 'uuid', comment: '所属分会' })
  @Index('idx_sponsor_client_org')
  orgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'company_name', type: 'varchar', length: 200, comment: '企业全称' })
  companyName: string;

  @Column({ name: 'contact_person', type: 'varchar', length: 50, nullable: true, comment: '联系人' })
  contactPerson: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 20, nullable: true, comment: '联系电话' })
  contactPhone: string;

  @Column({ name: 'category', type: 'varchar', length: 100, nullable: true, comment: '所属品类' })
  category: string;

  @Column({ name: 'intended_amount', type: 'decimal', precision: 14, scale: 2, nullable: true, comment: '意向金额' })
  intendedAmount: number;

  @Column({ name: 'is_referred_to_hq', type: 'boolean', default: false, comment: '是否引荐给总部' })
  isReferredToHq: boolean;

  @Column({ type: 'smallint', default: 1, comment: '1正常 0作废' })
  status: number;
}
