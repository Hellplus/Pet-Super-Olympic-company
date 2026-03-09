import { Entity, Column, Index, Tree, TreeChildren, TreeParent, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('sys_organization')
@Tree('materialized-path')
export class Organization extends BaseEntity {
  @Column({ type: 'varchar', length: 100, comment: '组织名称' })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true, comment: '组织编码' })
  code: string;

  @Column({
    name: 'org_type',
    type: 'smallint',
    comment: '组织类型：1=总部 2=大区 3=省级分会 4=市级分会 5=区县分会',
  })
  orgType: number;

  @Column({
    name: 'tree_path',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '树路径（如 HQ.EAST.SH）',
  })
  @Index('idx_org_tree_path')
  treePath: string;

  @Column({ type: 'int', default: 1, comment: '层级深度' })
  depth: number;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序号' })
  sortOrder: number;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ type: 'varchar', length: 200, nullable: true, comment: '详细地址' })
  address: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '负责人姓名' })
  leader: string;

  @Column({ type: 'smallint', default: 1, comment: '状态：1=启用 0=停用' })
  status: number;

  @Column({ name: 'area_code', type: 'varchar', length: 6, nullable: true, comment: '行政区划代码' })
  areaCode: string;

  @TreeParent()
  parent: Organization;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true, comment: '父组织ID' })
  parentId: string;

  @TreeChildren()
  children: Organization[];
}
