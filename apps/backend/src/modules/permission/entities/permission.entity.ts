import { Entity, Column, Tree, TreeChildren, TreeParent, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('sys_permission')
@Tree('materialized-path')
export class Permission extends BaseEntity {
  @Column({ type: 'varchar', length: 100, comment: '权限名称' })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true, comment: '权限标识（如 system:user:create）' })
  @Index('idx_perm_code')
  code: string;

  @Column({
    type: 'smallint',
    comment: '类型：1=目录 2=菜单 3=按钮/操作 4=数据权限',
  })
  type: number;

  @Column({ type: 'varchar', length: 200, nullable: true, comment: '路由路径' })
  path: string;

  @Column({ type: 'varchar', length: 200, nullable: true, comment: '组件路径' })
  component: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '重定向地址' })
  redirect: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '图标' })
  icon: string;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序号' })
  sortOrder: number;

  @Column({ name: 'is_visible', type: 'boolean', default: true, comment: '是否可见' })
  isVisible: boolean;

  @Column({ name: 'is_cache', type: 'boolean', default: false, comment: '是否缓存' })
  isCache: boolean;

  @Column({ name: 'is_external', type: 'boolean', default: false, comment: '是否外链' })
  isExternal: boolean;

  @Column({ type: 'smallint', default: 1, comment: '状态：1=启用 0=停用' })
  status: number;

  @Column({ name: 'api_path', type: 'varchar', length: 200, nullable: true, comment: 'API路径' })
  apiPath: string;

  @Column({ name: 'api_method', type: 'varchar', length: 10, nullable: true, comment: 'HTTP方法' })
  apiMethod: string;

  @TreeParent()
  parent: Permission;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true, comment: '父权限ID' })
  parentId: string;

  @TreeChildren()
  children: Permission[];
}
