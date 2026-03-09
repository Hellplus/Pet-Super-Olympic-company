import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SponsorContract } from './sponsor-contract.entity';

/** 权益交付任务 */
@Entity('biz_delivery_task')
export class DeliveryTask extends BaseEntity {
  @Column({ name: 'contract_id', type: 'uuid' })
  contractId: string;

  @ManyToOne(() => SponsorContract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: SponsorContract;

  @Column({ name: 'task_name', type: 'varchar', length: 200, comment: '任务名称(如2块A字板)' })
  taskName: string;

  @Column({ name: 'task_type', type: 'varchar', length: 50, comment: '类型: BOARD/BROADCAST/LOGO/BOOTH/OTHER' })
  taskType: string;

  @Column({ type: 'int', default: 1, comment: '要求数量' })
  quantity: number;

  @Column({ name: 'completed_quantity', type: 'int', default: 0, comment: '已完成数量' })
  completedQuantity: number;

  @Column({ name: 'event_id', type: 'uuid', nullable: true, comment: '关联赛事ID' })
  eventId: string;

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true, comment: '负责人ID' })
  assigneeId: string;

  @Column({ name: 'assignee_name', type: 'varchar', length: 50, nullable: true })
  assigneeName: string;

  @Column({ name: 'evidence_photos', type: 'jsonb', nullable: true, comment: '交付证据照片 [{url,lat,lng,timestamp,watermark}]' })
  evidencePhotos: any;

  @Column({ type: 'smallint', default: 0, comment: '0待执行 1进行中 2已完成 3已验收' })
  status: number;

  @Column({ name: 'deadline', type: 'date', nullable: true, comment: '截止日期' })
  deadline: Date;
}
