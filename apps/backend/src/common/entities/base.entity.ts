import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm';

/**
 * 所有业务实体的抽象基类
 * - UUID主键
 * - 创建/更新/删除审计字段
 * - 全局软删除支持
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'created_by', type: 'varchar', length: 64, nullable: true, comment: '创建人ID' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 64, nullable: true, comment: '更新人ID' })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true, comment: '删除时间(软删除)' })
  deletedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '备注' })
  remark: string;
}
