import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../organization/entities/organization.entity';

/** 赛事 */
@Entity('biz_event')
export class Event extends BaseEntity {
  @Column({ name: 'event_name', type: 'varchar', length: 200, comment: '赛事名称' })
  eventName: string;

  @Column({ name: 'event_code', type: 'varchar', length: 50, unique: true, comment: '赛事编号' })
  eventCode: string;

  @Column({ name: 'org_id', type: 'uuid' })
  @Index('idx_event_org')
  orgId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'event_date', type: 'date', comment: '开赛日期' })
  eventDate: Date;

  @Column({ name: 'event_end_date', type: 'date', nullable: true, comment: '结束日期' })
  eventEndDate: Date;

  @Column({ type: 'varchar', length: 300, nullable: true, comment: '举办地点' })
  venue: string;

  @Column({ name: 'event_type', type: 'varchar', length: 50, comment: '赛事类型' })
  eventType: string;

  @Column({ name: 'expected_participants', type: 'int', default: 0, comment: '预计参赛数' })
  expectedParticipants: number;

  @Column({ name: 'director_id', type: 'uuid', nullable: true, comment: '赛事总监ID' })
  directorId: string;

  @Column({ name: 'director_name', type: 'varchar', length: 50, nullable: true })
  directorName: string;

  @Column({ type: 'smallint', default: 0, comment: '0筹备中 1进行中 2已完赛 3已结案 9已取消' })
  status: number;

  @Column({ name: 'sop_template_id', type: 'uuid', nullable: true, comment: '使用的SOP模板ID' })
  sopTemplateId: string;

  @Column({ name: 'overall_progress', type: 'smallint', default: 0, comment: '整体进度 0-100' })
  overallProgress: number;
}
