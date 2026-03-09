import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** 分会入驻申请 */
@Entity('biz_branch_application')
export class BranchApplication extends BaseEntity {
  @Column({ name: 'applicant_name', type: 'varchar', length: 100, comment: '申请人姓名' })
  applicantName: string;

  @Column({ name: 'applicant_phone', type: 'varchar', length: 20, comment: '联系电话' })
  applicantPhone: string;

  @Column({ name: 'applicant_email', type: 'varchar', length: 100, nullable: true, comment: '邮箱' })
  applicantEmail: string;

  @Column({ name: 'branch_name', type: 'varchar', length: 200, comment: '拟设分会名称' })
  branchName: string;

  @Column({ name: 'province', type: 'varchar', length: 50, comment: '省份' })
  province: string;

  @Column({ name: 'city', type: 'varchar', length: 50, comment: '城市' })
  city: string;

  @Column({ name: 'district', type: 'varchar', length: 50, nullable: true, comment: '区县' })
  district: string;

  @Column({ name: 'detail_address', type: 'varchar', length: 300, nullable: true, comment: '详细地址' })
  detailAddress: string;

  @Column({ name: 'qualification_files', type: 'jsonb', nullable: true, comment: '资质文件列表 [{name,url,type}]' })
  qualificationFiles: any;

  @Column({ name: 'business_plan', type: 'text', nullable: true, comment: '商业计划说明' })
  businessPlan: string;

  @Column({
    type: 'smallint', default: 0,
    comment: '审批状态: 0=待初审 1=初审通过 2=复审通过 3=终审通过(已建档) 9=已拒绝',
  })
  status: number;

  @Column({ name: 'current_approver_id', type: 'uuid', nullable: true, comment: '当前审批人ID' })
  currentApproverId: string;

  @Column({ name: 'reject_reason', type: 'text', nullable: true, comment: '拒绝原因' })
  rejectReason: string;

  @Column({ name: 'approved_org_id', type: 'uuid', nullable: true, comment: '审批通过后创建的组织ID' })
  approvedOrgId: string;
}
