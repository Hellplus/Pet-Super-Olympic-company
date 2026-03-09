import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** 内部公告(政令直达) */
@Entity('biz_announcement')
export class Announcement extends BaseEntity {
  @Column({ type: 'varchar', length: 200, comment: '标题' })
  title: string;

  @Column({ type: 'text', comment: '内容(富文本)' })
  content: string;

  @Column({ name: 'announcement_type', type: 'varchar', length: 30, default: 'NORMAL', comment: 'RED_HEADER/NORMAL/URGENT' })
  announcementType: string;

  @Column({ name: 'target_scope', type: 'varchar', length: 20, default: 'ALL', comment: 'ALL全员/ORG指定分会' })
  targetScope: string;

  @Column({ name: 'target_org_ids', type: 'jsonb', nullable: true, comment: '指定分会ID列表' })
  targetOrgIds: string[];

  @Column({ name: 'publisher_id', type: 'uuid', comment: '发布人' })
  publisherId: string;

  @Column({ name: 'publisher_name', type: 'varchar', length: 50 })
  publisherName: string;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date;

  @Column({ type: 'smallint', default: 0, comment: '0草稿 1已发布' })
  status: number;

  @Column({ name: 'total_count', type: 'int', default: 0, comment: '应读人数' })
  totalCount: number;

  @Column({ name: 'read_count', type: 'int', default: 0, comment: '已读人数' })
  readCount: number;
}
