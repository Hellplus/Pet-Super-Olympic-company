import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** 赛事核心专业人才库 */
@Entity('biz_expert')
export class Expert extends BaseEntity {
  @Column({ type: 'varchar', length: 50, comment: '姓名' })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '手机号' })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '邮箱' })
  email: string;

  @Column({ type: 'smallint', default: 0, comment: '性别 0未知 1男 2女' })
  gender: number;

  @Column({ name: 'expert_type', type: 'varchar', length: 30, comment: '专家类型: JUDGE/VET/BEHAVIOR/OTHER' })
  @Index('idx_expert_type')
  expertType: string;

  @Column({ name: 'star_level', type: 'smallint', default: 3, comment: '星级 1-5' })
  starLevel: number;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '国籍' })
  nationality: string;

  @Column({ type: 'text', nullable: true, comment: '专业简介' })
  bio: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true, comment: '头像' })
  avatarUrl: string;

  @Column({ type: 'smallint', default: 1, comment: '状态 1启用 0停用' })
  status: number;
}
