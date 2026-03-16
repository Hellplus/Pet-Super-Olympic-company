import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Expert } from './expert.entity';

@Entity('biz_expert_certificate')
export class ExpertCertificate extends BaseEntity {
  @Column({ name: 'cert_type', type: 'varchar', length: 50, default: 'expert', comment: '证书类型: expert=专家, judge=裁判, committee=赛组委, local=地方, other=其他' })
  certType: string;

  @Column({ name: 'holder_name', type: 'varchar', length: 100, nullable: true, comment: '持证人姓名' })
  holderName: string;

  @Column({ name: 'expert_id', type: 'uuid', nullable: true })
  expertId: string;

  @ManyToOne(() => Expert, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'expert_id' })
  expert: Expert;

  @Column({ name: 'org_id', type: 'uuid', nullable: true, comment: '所属组织ID' })
  orgId: string;

  @Column({ name: 'cert_name', type: 'varchar', length: 200, comment: '证书名称' })
  certName: string;

  @Column({ name: 'cert_no', type: 'varchar', length: 100, nullable: true, comment: '证书编号' })
  certNo: string;

  @Column({ name: 'issuing_authority', type: 'varchar', length: 200, nullable: true, comment: '发证机构' })
  issuingAuthority: string;

  @Column({ name: 'issue_date', type: 'date', nullable: true, comment: '发证日期' })
  issueDate: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true, comment: '到期日期' })
  expiryDate: Date;

  @Column({ name: 'file_url', type: 'varchar', length: 500, nullable: true, comment: '证书扫描件URL' })
  fileUrl: string;

  @Column({ name: 'is_expired', type: 'boolean', default: false, comment: '是否已过期' })
  isExpired: boolean;
}
