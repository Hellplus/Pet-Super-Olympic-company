import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserService } from '../user/user.service';
import { LoginLog } from './entities/login-log.entity';
import { LoginDto, RefreshTokenDto, ChangePasswordDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(LoginLog)
    private readonly loginLogRepo: Repository<LoginLog>,
  ) {}

  async login(dto: LoginDto, ip: string, userAgent: string) {
    const user = await this.userService.findByUsername(dto.username);
    if (!user) {
      await this.saveLoginLog(dto.username, ip, userAgent, 0, '账号不存在');
      throw new UnauthorizedException('账号或密码错误');
    }

    if (user.status === 0) {
      await this.saveLoginLog(dto.username, ip, userAgent, 0, '账号已停用');
      throw new ForbiddenException('账号已停用');
    }

    if (user.status === 2 && user.lockUntil && user.lockUntil > new Date()) {
      await this.saveLoginLog(dto.username, ip, userAgent, 0, '账号已锁定');
      throw new ForbiddenException('账号已锁定，请稍后再试');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      await this.handleLoginFail(user);
      await this.saveLoginLog(dto.username, ip, userAgent, 0, '密码错误');
      throw new UnauthorizedException('账号或密码错误');
    }

    // 重置失败计数
    await this.userService.resetLoginFail(user.id);

    // 生成Token
    const tokens = await this.generateTokens(user);

    // 记录登录日志
    await this.saveLoginLog(dto.username, ip, userAgent, 1, '登录成功');

    // 更新最后登录信息
    await this.userService.updateLastLogin(user.id, ip);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
      userInfo: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        avatar: user.avatar,
        organizationId: user.organizationId,
        isSuperAdmin: user.isSuperAdmin,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('jwt.secret'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      // 验证Redis中是否存在
      const tokenHash = crypto.createHash('sha256').update(dto.refreshToken).digest('hex');
      const cached = await this.cacheManager.get(`refresh_token:${payload.sub}:${tokenHash}`);
      if (!cached) {
        throw new UnauthorizedException('刷新令牌已失效');
      }

      const user = await this.userService.findByIdWithPermissions(payload.sub);
      if (!user || (user as any).status !== 1) {
        throw new UnauthorizedException('用户不存在或已停用');
      }

      // 删除旧的refreshToken
      await this.cacheManager.del(`refresh_token:${payload.sub}:${tokenHash}`);

      // 生成新Token
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const userInfo = await this.userService.findById(userId);
    const user = await this.userService.findByUsername(userInfo.username);
    if (!user) throw new UnauthorizedException('用户不存在');

    const isValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('旧密码错误');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.userService.updatePassword(userId, hashedPassword);

    // 清除该用户的所有refreshToken
    // 通过pattern删除需要Redis scan，这里简化处理
    return { message: '密码修改成功，请重新登录' };
  }

  async logout(userId: string) {
    // 清除用户缓存
    await this.cacheManager.del(`user:info:${userId}`);
    await this.cacheManager.del(`user:permissions:${userId}`);
    return { message: '已退出登录' };
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, username: user.username, orgId: user.organizationId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.accessExpiresIn'),
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: this.configService.get('jwt.refreshExpiresIn') },
    );

    // 存储refreshToken到Redis
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.cacheManager.set(
      `refresh_token:${user.id}:${tokenHash}`,
      { userId: user.id, createdAt: new Date().toISOString() },
      604800000, // 7天(ms)
    );

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private async handleLoginFail(user: any) {
    const failCount = user.loginFailCount + 1;
    if (failCount >= 5) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 锁定30分钟
      await this.userService.lockAccount(user.id, failCount, lockUntil);
    } else {
      await this.userService.incrementLoginFail(user.id, failCount);
    }
  }

  private async saveLoginLog(
    username: string,
    ip: string,
    userAgent: string,
    status: number,
    message: string,
  ) {
    const log = this.loginLogRepo.create({ username, ip, userAgent, status, message });
    await this.loginLogRepo.save(log);
  }
}
