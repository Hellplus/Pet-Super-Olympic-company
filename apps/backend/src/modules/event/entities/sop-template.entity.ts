import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** SOP 标准办赛任务包模板 */
@Entity('biz_sop_template')
export class SopTemplate extends BaseEntity {
  @Column({ name: 'template_name', type: 'varchar', length: 200, comment: '模板名称' })
  templateName: string;

  @Column({ name: 'event_type', type: 'varchar', length: 50, comment: '适用赛事类型' })
  eventType: string;

  @Column({ type: 'text', nullable: true, comment: '模板描述' })
  description: string;

  @Column({ type: 'smallint', default: 1, comment: '1启用 0停用' })
  status: number;
}
