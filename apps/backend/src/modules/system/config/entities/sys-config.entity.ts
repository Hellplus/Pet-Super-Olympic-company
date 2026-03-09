import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';

@Entity('sys_config')
export class SysConfig extends BaseEntity {
  @Column({ name: 'config_key', type: 'varchar', length: 100, unique: true, comment: '参数键名' })
  configKey: string;

  @Column({ name: 'config_value', type: 'text', comment: '参数键值' })
  configValue: string;

  @Column({ name: 'config_name', type: 'varchar', length: 100, comment: '参数名称' })
  configName: string;

  @Column({ name: 'is_system', type: 'boolean', default: false, comment: '是否系统内置' })
  isSystem: boolean;
}
