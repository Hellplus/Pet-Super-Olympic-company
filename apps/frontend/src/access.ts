export default function access(initialState: { currentUser?: any } | undefined) {
  const { currentUser } = initialState ?? {};
  const permissions: string[] = currentUser?.permissions || [];
  const isSuperAdmin = !!currentUser?.isSuperAdmin;

  return {
    // 路由级权限
    canAdmin: isSuperAdmin || permissions.some((p: string) => p.startsWith('system:')),

    // 通用权限检查
    hasPermission: (code: string) => isSuperAdmin || permissions.includes(code),

    // 系统管理模块
    canCreateUser: isSuperAdmin || permissions.includes('system:user:create'),
    canDeleteUser: isSuperAdmin || permissions.includes('system:user:delete'),
    canAssignRole: isSuperAdmin || permissions.includes('system:user:assign-role'),
    canManageRole: isSuperAdmin || permissions.includes('system:role'),
    canManagePermission: isSuperAdmin || permissions.includes('system:permission'),
    canManageOrg: isSuperAdmin || permissions.includes('system:organization'),
    canMeltdownOrg: isSuperAdmin || permissions.includes('system:organization:disable'),
    canManageDict: isSuperAdmin || permissions.includes('system:dict'),
    canManageConfig: isSuperAdmin || permissions.includes('system:config'),

    // 财务模块
    canCreateExpense: isSuperAdmin || permissions.includes('finance:expense:create'),
    canApproveExpense: isSuperAdmin || permissions.includes('finance:expense:approve'),
    canManageBudget: isSuperAdmin || permissions.includes('finance:budget'),

    // 招商模块
    canManageClient: isSuperAdmin || permissions.includes('sponsorship:client'),
    canManageContract: isSuperAdmin || permissions.includes('sponsorship:contract'),

    // 赛事模块
    canCreateEvent: isSuperAdmin || permissions.includes('event:create'),
    canManageSop: isSuperAdmin || permissions.includes('event:sop'),

    // 超级管理员标识
    isSuperAdmin,
  };
}
