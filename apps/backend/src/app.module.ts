import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

class MemoryCache {
  private store = new Map<string, { value: any; expiry: number }>();
  async get(key: string) { const e = this.store.get(key); if (!e) return undefined; if (e.expiry && Date.now() > e.expiry) { this.store.delete(key); return undefined; } return e.value; }
  async set(key: string, value: any, ttl?: number) { this.store.set(key, { value, expiry: ttl ? Date.now() + ttl : 0 }); }
  async del(key: string) { this.store.delete(key); }
  async reset() { this.store.clear(); }
}

@Global()
@Module({ providers: [{ provide: CACHE_MANAGER, useValue: new MemoryCache() }], exports: [CACHE_MANAGER] })
class CacheProviderModule {}

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { SystemModule } from './modules/system/system.module';
import { BranchHrModule } from './modules/branch-hr/branch-hr.module';
import { FinanceModule } from './modules/finance/finance.module';
import { SponsorshipModule } from './modules/sponsorship/sponsorship.module';
import { EventModule } from './modules/event/event.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadModule } from './modules/upload/upload.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { DataScopeGuard } from './common/guards/data-scope.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig, redisConfig], envFilePath: ['.env.local', '.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    CacheProviderModule,
    DatabaseModule,
    AuthModule, UserModule, OrganizationModule, RoleModule,
    PermissionModule, AuditLogModule, SystemModule,
    BranchHrModule, FinanceModule, SponsorshipModule, EventModule,
    DashboardModule, UploadModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: DataScopeGuard },
  ],
})
export class AppModule {}
