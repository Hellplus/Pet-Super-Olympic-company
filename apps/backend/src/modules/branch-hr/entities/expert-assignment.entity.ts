import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Expert } from './expert.entity';

@Entity('biz_expert_assignment')
export class ExpertAssignment extends BaseEntity {
  @Column({ name: 'expert_id', type: 'uuid' })
  expertId: string;

  @ManyToOne(() => Expert, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expert_id' })
  expert: Expert;

  @Column({ name: 'event_id', type: 'uuid', comment: '赛事ID' })
  eventId: string;

  @Column({ name: 'event_name', type: 'varchar', length: 200, comment: '赛事名称(冗余)' })
  eventName: string;

  @Column({ name: 'org_id', type: 'uuid', comment: '举办分会ID' })
  orgId: string;

  @Column({ type: 'varchar', length: 50, comment: '角色: CHIEF_JUDGE/JUDGE/VET/SPECIALIST' })
  role: string;

  @Column({ name: 'assign_date', type: 'date', comment: '执裁日期' })
  assignDate: Date;

  @Column({ type: 'smallint', default: 1, comment: '评价分 1-5' })
  rating: number;

  @Column({ name: 'review_comment', type: 'text', nullable: true, comment: '赛后评价' })
  reviewComment: string;

  @Column({ type: 'smallint', default: 0, comment: '0待确认 1已确认 2已完成 9已取消' })
  status: number;
}
