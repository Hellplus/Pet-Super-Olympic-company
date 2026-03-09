import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

// ===== Public接口（跳过JWT认证） =====
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ===== 权限装饰器 =====
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// ===== 角色装饰器 =====
export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// ===== 数据范围装饰器 =====
export const DATA_SCOPE_KEY = 'dataScope';
export const DataScope = () => SetMetadata(DATA_SCOPE_KEY, true);

// ===== 跳过审计装饰器 =====
export const SKIP_AUDIT_KEY = 'skipAudit';
export const SkipAudit = () => SetMetadata(SKIP_AUDIT_KEY, true);

// ===== 当前用户参数装饰器 =====
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
