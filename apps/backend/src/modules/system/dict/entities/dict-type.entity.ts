import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { DictData } from './dict-data.entity';

@Entity('sys_dict_type')
export class DictType extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true, comment: '字典类型编码' })
  code: string;

  @Column({ type: 'varchar', length: 100, comment: '字典类型名称' })
  name: string;

  @Column({ type: 'smallint', default: 1, comment: '状态：1=启用 0=停用' })
  status: number;

  @OneToMany(() => DictData, (data) => data.dictType, { cascade: true })
  items: DictData[];
}
