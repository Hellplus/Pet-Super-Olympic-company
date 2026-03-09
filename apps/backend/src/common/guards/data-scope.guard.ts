import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DATA_SCOPE_KEY } from '../decorators';

/**
 * 数据范围守卫
 * 在请求对象上挂载 dataScope 信息，供 Service 层构建查询时使用
 *
 * 数据范围策略：
 * 1 = 全部数据（总部穿透）
 * 2 = 本组织及所有下级组织
 * 3 = 仅本组织数据
 * 4 = 仅本人数据
 * 5 = 自定义（指定可见组织列表）
 */
@Injectable()
export class DataScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const needDataScope = this.reflector.getAllAndOverride<boolean>(DATA_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!needDataScope) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true;

    if (user.isSuperAdmin) {
      request.dataScope = { type: 1, orgIds: [] };
      return true;
    }

    const roles = user.roles || [];
    let broadestScope = 4;
    let customOrgIds: string[] = [];

    for (const role of roles) {
      if (role.dataScope < broadestScope) {
        broadestScope = role.dataScope;
      }
      if (role.dataScope === 5 && role.customOrgIds) {
        customOrgIds = [...customOrgIds, ...role.customOrgIds];
      }
    }

    request.dataScope = {
      type: broadestScope,
      userOrgId: user.organizationId,
      userOrgTreePath: user.orgTreePath,
      userId: user.id,
      orgIds: [...new Set(customOrgIds)],
    };

    return true;
  }
}
