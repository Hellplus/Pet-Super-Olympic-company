import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('sys_uploaded_file')
export class UploadedFile extends BaseEntity {
  @Column({ name: 'original_name', type: 'varchar', length: 500, comment: '原始文件名' })
  originalName: string;

  @Column({ name: 'stored_name', type: 'varchar', length: 500, comment: '存储文件名' })
  storedName: string;

  @Column({ name: 'file_path', type: 'varchar', length: 1000, comment: '存储路径' })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint', comment: '文件大小(bytes)' })
  fileSize: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, comment: 'MIME类型' })
  mimeType: string;

  @Column({ name: 'file_ext', type: 'varchar', length: 20, comment: '文件扩展名' })
  fileExt: string;

  @Column({ type: 'varchar', length: 64, nullable: true, comment: '文件MD5校验' })
  md5: string;

  @Column({ name: 'biz_type', type: 'varchar', length: 50, nullable: true, comment: '业务类型' })
  @Index('idx_file_biz_type')
  bizType: string;

  @Column({ name: 'biz_id', type: 'uuid', nullable: true, comment: '业务ID' })
  @Index('idx_file_biz_id')
  bizId: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true, comment: '所属组织' })
  @Index('idx_file_org_id')
  organizationId: string;

  @Column({ name: 'is_watermarked', type: 'boolean', default: false, comment: '是否已添加水印' })
  isWatermarked: boolean;

  @Column({ name: 'watermark_text', type: 'varchar', length: 200, nullable: true, comment: '水印文字内容' })
  watermarkText: string;

  @Column({ name: 'access_level', type: 'varchar', length: 20, default: 'private', comment: '访问级别: public/private/internal' })
  accessLevel: string;

  @Column({ name: 'download_count', type: 'int', default: 0, comment: '下载次数' })
  downloadCount: number;
}
