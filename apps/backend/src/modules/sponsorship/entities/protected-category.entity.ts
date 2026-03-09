import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** 受保护品类(品牌护城河) */
@Entity('biz_protected_category')
export class ProtectedCategory extends BaseEntity {
  @Column({ name: 'category_name', type: 'varchar', length: 100, unique: true, comment: '品类名称' })
  categoryName: string;

  @Column({ name: 'brand_name', type: 'varchar', length: 200, nullable: true, comment: '独家保护品牌' })
  brandName: string;

  @Column({ name: 'protection_scope', type: 'varchar', length: 20, default: 'GLOBAL', comment: 'GLOBAL全球/REGIONAL区域' })
  protectionScope: string;

  @Column({ name: 'contract_no', type: 'varchar', length: 100, nullable: true, comment: '关联合同编号' })
  contractNo: string;

  @Column({ name: 'expire_date', type: 'date', nullable: true, comment: '保护到期日' })
  expireDate: Date;

  @Column({ type: 'smallint', default: 1, comment: '1生效 0过期' })
  status: number;
}
