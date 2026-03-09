import { Entity, Column, ManyToMany, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { RolePermission } from './role-permission.entity';

@Entity('sys_role')
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, comment: '角色编码' })
  @Index('idx_role_code')
  code: string;

  @Column({ type: 'varchar', length: 100, comment: '角色名称' })
  name: string;

  @Column({
    name: 'data_scope',
    type: 'smallint',
    default: 4,
    comment: '数据范围：1=全部 2=本组织及下级 3=仅本组织 4=仅本人 5=自定义',
  })
  dataScope: number;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序号' })
  sortOrder: number;

  @Column({ type: 'smallint', default: 1, comment: '状态：1=启用 0=停用' })
  status: number;

  @Column({ name: 'is_system', type: 'boolean', default: false, comment: '是否系统内置' })
  isSystem: boolean;

  @OneToMany(() => RolePermission, (rp) => rp.role, { cascade: true })
  rolePermissions: RolePermission[];

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
