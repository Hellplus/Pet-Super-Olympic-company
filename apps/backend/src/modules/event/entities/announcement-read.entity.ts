import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** 公告已读回执 */
@Entity('biz_announcement_read')
@Index('idx_ann_read_unique', ['announcementId', 'userId'], { unique: true })
export class AnnouncementRead extends BaseEntity {
  @Column({ name: 'announcement_id', type: 'uuid' })
  announcementId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'user_name', type: 'varchar', length: 50 })
  userName: string;

  @Column({ name: 'read_at', type: 'timestamptz', comment: '阅读时间' })
  readAt: Date;
}
