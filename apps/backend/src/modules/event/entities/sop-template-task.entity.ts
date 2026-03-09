import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SopTemplate } from './sop-template.entity';

/** SOP模板任务节点 */
@Entity('biz_sop_template_task')
export class SopTemplateTask extends BaseEntity {
  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @ManyToOne(() => SopTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: SopTemplate;

  @Column({ name: 'task_name', type: 'varchar', length: 200, comment: '任务名称' })
  taskName: string;

  @Column({ name: 'days_before_event', type: 'int', comment: '开赛前N天完成(倒计时基准)' })
  daysBeforeEvent: number;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序' })
  sortOrder: number;

  @Column({ name: 'default_role', type: 'varchar', length: 50, nullable: true, comment: '默认负责角色' })
  defaultRole: string;

  @Column({ type: 'text', nullable: true, comment: '任务描述' })
  description: string;

  @Column({ name: 'is_required', type: 'boolean', default: true, comment: '是否必做' })
  isRequired: boolean;
}
