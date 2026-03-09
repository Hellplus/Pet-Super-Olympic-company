import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('sys_login_log')
export class LoginLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, comment: '登录账号' })
  @Index('idx_login_log_username')
  username: string;

  @Column({ type: 'varchar', length: 50, comment: '登录IP' })
  ip: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true, comment: 'User-Agent' })
  userAgent: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '浏览器' })
  browser: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '操作系统' })
  os: string;

  @Column({ type: 'smallint', comment: '登录结果：1=成功 0=失败' })
  status: number;

  @Column({ type: 'varchar', length: 200, nullable: true, comment: '失败原因' })
  message: string;

  @CreateDateColumn({ name: 'login_time', type: 'timestamptz', comment: '登录时间' })
  @Index('idx_login_log_time')
  loginTime: Date;
}
