import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { Role } from '../../role/entities/role.entity';

@Entity('sys_user')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, comment: '登录账号' })
  @Index('idx_user_username')
  username: string;

  @Column({ type: 'varchar', length: 255, comment: '密码（bcrypt）' })
  @Exclude()
  password: string;

  @Column({ name: 'real_name', type: 'varchar', length: 50, comment: '真实姓名' })
  realName: string;

  @Column({ name: 'employee_no', type: 'varchar', length: 50, nullable: true, comment: '工号' })
  employeeNo: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '邮箱' })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '手机号' })
  phone: string;

  @Column({ type: 'smallint', default: 0, comment: '性别：0=未知 1=男 2=女' })
  gender: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '头像URL' })
  avatar: string;

  @Column({ type: 'smallint', default: 1, comment: '状态：1=启用 0=停用 2=锁定' })
  status: number;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '职位' })
  position: string;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true, comment: '最后登录时间' })
  lastLoginAt: Date;

  @Column({ name: 'last_login_ip', type: 'varchar', length: 50, nullable: true, comment: '最后登录IP' })
  lastLoginIp: string;

  @Column({ name: 'login_fail_count', type: 'int', default: 0, comment: '连续登录失败次数' })
  loginFailCount: number;

  @Column({ name: 'lock_until', type: 'timestamptz', nullable: true, comment: '锁定到期时间' })
  lockUntil: Date;

  @Column({ name: 'is_super_admin', type: 'boolean', default: false, comment: '是否超级管理员' })
  isSuperAdmin: boolean;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'organization_id', type: 'uuid', comment: '所属组织ID' })
  @Index('idx_user_org_id')
  organizationId: string;

  @ManyToMany(() => Role, (role) => role.users, { eager: false })
  @JoinTable({
    name: 'sys_user_role',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}
