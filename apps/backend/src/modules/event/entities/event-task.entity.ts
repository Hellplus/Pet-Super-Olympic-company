import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Event } from './event.entity';

/** 赛事实际任务(从模板派发) */
@Entity('biz_event_task')
export class EventTask extends BaseEntity {
  @Column({ name: 'event_id', type: 'uuid' })
  @Index('idx_event_task_event')
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ name: 'task_name', type: 'varchar', length: 200 })
  taskName: string;

  @Column({ name: 'deadline', type: 'date', comment: '截止日期(根据开赛日倒推)' })
  deadline: Date;

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true, comment: '负责人ID' })
  assigneeId: string;

  @Column({ name: 'assignee_name', type: 'varchar', length: 50, nullable: true })
  assigneeName: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'smallint', default: 0, comment: '0待开始 1进行中 2已完成 3已延期 9已取消' })
  status: number;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true, comment: '完成备注' })
  feedback: string;
}
