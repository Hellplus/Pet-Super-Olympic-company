import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { DictType } from './dict-type.entity';

@Entity('sys_dict_data')
@Index('idx_dict_data_type_value', ['dictTypeId', 'value'], { unique: true })
export class DictData extends BaseEntity {
  @Column({ type: 'varchar', length: 100, comment: '字典标签' })
  label: string;

  @Column({ type: 'varchar', length: 100, comment: '字典值' })
  value: string;

  @Column({ name: 'css_class', type: 'varchar', length: 50, nullable: true, comment: 'CSS类名' })
  cssClass: string;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序号' })
  sortOrder: number;

  @Column({ type: 'smallint', default: 1, comment: '状态：1=启用 0=停用' })
  status: number;

  @ManyToOne(() => DictType, (type) => type.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dict_type_id' })
  dictType: DictType;

  @Column({ name: 'dict_type_id', type: 'uuid' })
  dictTypeId: string;
}
