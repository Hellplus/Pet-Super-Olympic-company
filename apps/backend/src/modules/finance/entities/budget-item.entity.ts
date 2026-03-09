import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EventBudget } from './event-budget.entity';

/** 预算科目明细 */
@Entity('biz_budget_item')
export class BudgetItem extends BaseEntity {
  @Column({ name: 'budget_id', type: 'uuid' })
  budgetId: string;

  @ManyToOne(() => EventBudget, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: EventBudget;

  @Column({ name: 'subject_name', type: 'varchar', length: 100, comment: '科目名称(场地/宣发/奖品/裁判等)' })
  subjectName: string;

  @Column({ name: 'budget_amount', type: 'decimal', precision: 14, scale: 2, comment: '预算金额' })
  budgetAmount: number;

  @Column({ name: 'used_amount', type: 'decimal', precision: 14, scale: 2, default: 0, comment: '已使用金额' })
  usedAmount: number;
}
