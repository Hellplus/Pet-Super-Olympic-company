/** 组织类型 */
export enum OrgType {
  HEADQUARTERS = 1,   // 总部
  REGION = 2,         // 大区
  PROVINCE = 3,       // 省级分会
  CITY = 4,           // 市级分会
  DISTRICT = 5,       // 区县分会
}

/** 通用状态 */
export enum Status {
  DISABLED = 0,
  ENABLED = 1,
  LOCKED = 2,
}

/** 权限类型 */
export enum PermissionType {
  DIRECTORY = 1,  // 目录
  MENU = 2,       // 菜单
  BUTTON = 3,     // 按钮/操作
  DATA = 4,       // 数据权限
}

/** 数据范围 */
export enum DataScopeEnum {
  ALL = 1,              // 全部数据
  ORG_AND_CHILDREN = 2, // 本组织及下级
  ORG_ONLY = 3,         // 仅本组织
  SELF_ONLY = 4,        // 仅本人
  CUSTOM = 5,           // 自定义
}

/** 性别 */
export enum Gender {
  UNKNOWN = 0,
  MALE = 1,
  FEMALE = 2,
}

/** 审计操作类型 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  QUERY = 'QUERY',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}
