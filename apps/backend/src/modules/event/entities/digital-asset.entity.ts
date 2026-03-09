import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** IP数字资产(防泄密云盘) */
@Entity('biz_digital_asset')
export class DigitalAsset extends BaseEntity {
  @Column({ name: 'asset_name', type: 'varchar', length: 200, comment: '资产名称' })
  assetName: string;

  @Column({ name: 'asset_type', type: 'varchar', length: 50, comment: 'VI/RULE_BOOK/TEMPLATE/OTHER' })
  assetType: string;

  @Column({ name: 'file_url', type: 'varchar', length: 500, comment: '文件URL' })
  fileUrl: string;

  @Column({ name: 'file_size', type: 'int', default: 0, comment: '文件大小(bytes)' })
  fileSize: number;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '版本号' })
  version: string;

  @Column({ name: 'is_latest', type: 'boolean', default: true, comment: '是否最新版' })
  isLatest: boolean;

  @Column({ name: 'uploaded_by', type: 'varchar', length: 50 })
  uploadedBy: string;

  @Column({ type: 'smallint', default: 1, comment: '1有效 0作废' })
  status: number;
}
