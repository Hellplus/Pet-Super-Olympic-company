import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../organization/entities/organization.entity';

/** 赛事预算包 */
@Entity('biz_event_budget')
export class EventBudget extends BaseEntity {
  @Column({ name: 'org_id', type: 'uuid', comment: '提报分会' })
  orgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'event_id', type: 'uuid', nullable: true, comment: '关联赛事ID' })
  eventId: string;

  @Column({ name: 'event_name', type: 'varchar', length: 200, comment: '赛事名称(冗余)' })
  eventName: string;

  @Column({ name: 'total_budget', type: 'decimal', precision: 14, scale: 2, comment: '预算总额' })
  totalBudget: number;

  @Column({ name: 'used_amount', type: 'decimal', precision: 14, scale: 2, default: 0, comment: '已用金额' })
  usedAmount: number;

  @Column({ name: 'remaining_amount', type: 'decimal', precision: 14, scale: 2, default: 0, comment: '剩余金额' })
  remainingAmount: number;

  @Column({ type: 'smallint', default: 0, comment: '0待审批 1已通过(锁定) 2已驳回 3已结案' })
  status: number;
}
