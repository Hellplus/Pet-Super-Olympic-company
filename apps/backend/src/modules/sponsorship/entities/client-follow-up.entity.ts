import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SponsorClient } from './sponsor-client.entity';

/** 客户跟进记录 */
@Entity('biz_client_follow_up')
export class ClientFollowUp extends BaseEntity {
  @Column({ name: 'client_id', type: 'uuid', comment: '客户ID' })
  clientId: string;

  @ManyToOne(() => SponsorClient)
  @JoinColumn({ name: 'client_id' })
  client: SponsorClient;

  @Column({ name: 'contact_type', type: 'varchar', length: 20, comment: '跟进方式: phone/visit/email/wechat/other' })
  contactType: string;

  @Column({ type: 'text', comment: '跟进内容' })
  content: string;

  @Column({ name: 'next_follow_date', type: 'date', nullable: true, comment: '下次跟进日期' })
  nextFollowDate: Date;

  @Column({ name: 'creator_name', type: 'varchar', length: 50, nullable: true, comment: '记录人姓名' })
  creatorName: string;
}
