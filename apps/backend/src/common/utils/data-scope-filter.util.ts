import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export interface DataScopeContext {
  type: number; // 1=全部 2=本级及下级 3=仅本级 4=仅本人 5=自定义
  userOrgId?: string;
  userOrgTreePath?: string;
  userId?: string;
  orgIds?: string[];
}

/**
 * 在 QueryBuilder 上自动附加数据范围过滤条件
 */
export function applyDataScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  dataScope: DataScopeContext,
  orgField: string = 'entity.organizationId',
  userField: string = 'entity.createdBy',
): SelectQueryBuilder<T> {
  switch (dataScope.type) {
    case 1: // 全部数据 - 不附加条件
      break;
    case 2: // 本组织及下级
      qb.andWhere(
        `${orgField} IN (SELECT id FROM sys_organization WHERE tree_path LIKE :treePath)`,
        { treePath: `${dataScope.userOrgTreePath}%` },
      );
      break;
    case 3: // 仅本组织
      qb.andWhere(`${orgField} = :scopeOrgId`, { scopeOrgId: dataScope.userOrgId });
      break;
    case 4: // 仅本人
      qb.andWhere(`${userField} = :scopeUserId`, { scopeUserId: dataScope.userId });
      break;
    case 5: // 自定义组织列表
      if (dataScope.orgIds && dataScope.orgIds.length > 0) {
        qb.andWhere(`${orgField} IN (:...scopeOrgIds)`, { scopeOrgIds: dataScope.orgIds });
      }
      break;
  }
  return qb;
}
