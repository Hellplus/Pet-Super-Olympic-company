import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from './role.entity';
import { Permission } from '../../permission/entities/permission.entity';

@Entity('sys_role_permission')
@Index('idx_role_perm_unique', ['roleId', 'permissionId'], { unique: true })
export class RolePermission extends BaseEntity {
  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @Column({ name: 'permission_id', type: 'uuid' })
  permissionId: string;
}
