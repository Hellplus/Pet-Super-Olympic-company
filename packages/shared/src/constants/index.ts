/** 默认超管角色编码 */
export const SUPER_ADMIN_ROLE = 'super_admin';

/** 默认分页参数 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Redis 缓存键前缀 */
export const CACHE_PREFIX = {
  USER_INFO: 'user:info:',
  USER_PERMISSIONS: 'user:permissions:',
  REFRESH_TOKEN: 'refresh_token:',
  DICT: 'dict:',
  CONFIG: 'config:',
} as const;

/** 缓存 TTL（秒） */
export const CACHE_TTL = {
  USER_INFO: 3600,        // 1小时
  USER_PERMISSIONS: 3600, // 1小时
  REFRESH_TOKEN: 604800,  // 7天
  DICT: 86400,            // 24小时
  CONFIG: 86400,          // 24小时
} as const;
