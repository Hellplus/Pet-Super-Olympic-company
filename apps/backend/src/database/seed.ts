import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * IPOC管控系统 - 种子数据初始化
 * 运行方式: pnpm --filter @ipoc/backend run seed
 */
async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'ipoc',
    password: process.env.DB_PASSWORD || 'ipoc123456',
    database: process.env.DB_DATABASE || 'ipoc_admin',
    synchronize: false,
    logging: ['error'],
  });

  await dataSource.initialize();
  console.log('📦 数据库连接成功');

  const qr = dataSource.createQueryRunner();

  try {
    // ====== 检查是否已初始化 ======
    const existingUser = await qr.query(
      "SELECT id FROM sys_user WHERE username = 'admin' AND deleted_at IS NULL LIMIT 1"
    );
    if (existingUser.length > 0) {
      console.log('⚠️  种子数据已存在，跳过初始化');
      return;
    }

    await qr.startTransaction();

    // ====== 1. 创建根组织 - 总部 ======
    const orgId = uuidv4();
    await qr.query(`
      INSERT INTO sys_organization (id, name, code, org_type, tree_path, depth, sort_order, status, leader, phone, address, created_at, updated_at)
      VALUES ($1, '国际宠物奥林匹克超级赛组委会', 'IPOC_HQ', 1, 'IPOC_HQ', 1, 1, 1, '系统管理员', '010-88888888', '北京市朝阳区', NOW(), NOW())
    `, [orgId]);
    console.log('✅ 组织架构 - 总部节点已创建');

    // ====== 2. 创建权限菜单树 ======
    const permIds: Record<string, string> = {};

    const permissions = [
      // 一级目录
      { key: 'dashboard', name: '工作台', code: 'dashboard', type: 2, path: '/dashboard', component: './Dashboard', icon: 'DashboardOutlined', sortOrder: 1, parentKey: null },
      { key: 'system', name: '系统管理', code: 'system', type: 1, path: '/system', component: null, icon: 'SettingOutlined', sortOrder: 100, parentKey: null },

      // 系统管理子菜单
      { key: 'system:user', name: '用户管理', code: 'system:user', type: 2, path: '/system/user', component: './System/User', icon: 'UserOutlined', sortOrder: 1, parentKey: 'system' },
      { key: 'system:role', name: '角色管理', code: 'system:role', type: 2, path: '/system/role', component: './System/Role', icon: 'TeamOutlined', sortOrder: 2, parentKey: 'system' },
      { key: 'system:permission', name: '权限管理', code: 'system:permission', type: 2, path: '/system/permission', component: './System/Permission', icon: 'SafetyOutlined', sortOrder: 3, parentKey: 'system' },
      { key: 'system:organization', name: '组织架构', code: 'system:organization', type: 2, path: '/system/organization', component: './System/Organization', icon: 'ApartmentOutlined', sortOrder: 4, parentKey: 'system' },
      { key: 'system:dict', name: '数据字典', code: 'system:dict', type: 2, path: '/system/dict', component: './System/Dict', icon: 'BookOutlined', sortOrder: 5, parentKey: 'system' },
      { key: 'system:audit-log', name: '审计日志', code: 'system:audit-log', type: 2, path: '/system/audit-log', component: './System/AuditLog', icon: 'FileSearchOutlined', sortOrder: 6, parentKey: 'system' },
      { key: 'system:config', name: '系统配置', code: 'system:config', type: 2, path: '/system/config', component: './System/Config', icon: 'ToolOutlined', sortOrder: 7, parentKey: 'system' },

      // 用户管理按钮权限
      { key: 'system:user:create', name: '新增用户', code: 'system:user:create', type: 3, path: null, component: null, icon: null, sortOrder: 1, parentKey: 'system:user' },
      { key: 'system:user:update', name: '编辑用户', code: 'system:user:update', type: 3, path: null, component: null, icon: null, sortOrder: 2, parentKey: 'system:user' },
      { key: 'system:user:delete', name: '删除用户', code: 'system:user:delete', type: 3, path: null, component: null, icon: null, sortOrder: 3, parentKey: 'system:user' },
      { key: 'system:user:disable', name: '封停用户', code: 'system:user:disable', type: 3, path: null, component: null, icon: null, sortOrder: 4, parentKey: 'system:user' },
      { key: 'system:user:assign-role', name: '分配角色', code: 'system:user:assign-role', type: 3, path: null, component: null, icon: null, sortOrder: 5, parentKey: 'system:user' },

      // 角色管理按钮权限
      { key: 'system:role:create', name: '新增角色', code: 'system:role:create', type: 3, path: null, component: null, icon: null, sortOrder: 1, parentKey: 'system:role' },
      { key: 'system:role:update', name: '编辑角色', code: 'system:role:update', type: 3, path: null, component: null, icon: null, sortOrder: 2, parentKey: 'system:role' },
      { key: 'system:role:delete', name: '删除角色', code: 'system:role:delete', type: 3, path: null, component: null, icon: null, sortOrder: 3, parentKey: 'system:role' },
      { key: 'system:role:assign-perm', name: '分配权限', code: 'system:role:assign-perm', type: 3, path: null, component: null, icon: null, sortOrder: 4, parentKey: 'system:role' },

      // 权限管理按钮
      { key: 'system:permission:create', name: '新增权限', code: 'system:permission:create', type: 3, path: null, component: null, icon: null, sortOrder: 1, parentKey: 'system:permission' },
      { key: 'system:permission:update', name: '编辑权限', code: 'system:permission:update', type: 3, path: null, component: null, icon: null, sortOrder: 2, parentKey: 'system:permission' },
      { key: 'system:permission:delete', name: '删除权限', code: 'system:permission:delete', type: 3, path: null, component: null, icon: null, sortOrder: 3, parentKey: 'system:permission' },

      // 组织架构按钮
      { key: 'system:organization:create', name: '新增组织', code: 'system:organization:create', type: 3, path: null, component: null, icon: null, sortOrder: 1, parentKey: 'system:organization' },
      { key: 'system:organization:update', name: '编辑组织', code: 'system:organization:update', type: 3, path: null, component: null, icon: null, sortOrder: 2, parentKey: 'system:organization' },
      { key: 'system:organization:delete', name: '删除组织', code: 'system:organization:delete', type: 3, path: null, component: null, icon: null, sortOrder: 3, parentKey: 'system:organization' },
      { key: 'system:organization:disable', name: '熔断停用', code: 'system:organization:disable', type: 3, path: null, component: null, icon: null, sortOrder: 4, parentKey: 'system:organization' },

      // 字典管理按钮
      { key: 'system:dict:create', name: '新增字典', code: 'system:dict:create', type: 3, path: null, component: null, icon: null, sortOrder: 1, parentKey: 'system:dict' },
      { key: 'system:dict:update', name: '编辑字典', code: 'system:dict:update', type: 3, path: null, component: null, icon: null, sortOrder: 2, parentKey: 'system:dict' },
      { key: 'system:dict:delete', name: '删除字典', code: 'system:dict:delete', type: 3, path: null, component: null, icon: null, sortOrder: 3, parentKey: 'system:dict' },

      // 系统配置按钮
      { key: 'system:config:create', name: '新增配置', code: 'system:config:create', type: 3, path: null, component: null, icon: null, sortOrder: 1, parentKey: 'system:config' },
      { key: 'system:config:update', name: '编辑配置', code: 'system:config:update', type: 3, path: null, component: null, icon: null, sortOrder: 2, parentKey: 'system:config' },
      { key: 'system:config:delete', name: '删除配置', code: 'system:config:delete', type: 3, path: null, component: null, icon: null, sortOrder: 3, parentKey: 'system:config' },
    ];

    // 先插入所有根级权限（parentKey=null）
    for (const perm of permissions.filter(p => p.parentKey === null)) {
      const id = uuidv4();
      permIds[perm.key] = id;
      await qr.query(`
        INSERT INTO sys_permission (id, name, code, type, path, component, icon, sort_order, is_visible, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 1, NOW(), NOW())
      `, [id, perm.name, perm.code, perm.type, perm.path, perm.component, perm.icon, perm.sortOrder]);
    }

    // 然后插入二级权限
    for (const perm of permissions.filter(p => p.parentKey !== null && !p.parentKey!.includes(':'))) {
      // Skip if parentKey has colons (it's a third-level item) - no wait, "system:user" has a colon
      // Actually let me re-check: parentKey 'system' is first-level child
    }

    // Actually, let's do it level by level
    // Level 1 parents (parentKey is a root): system's children
    for (const perm of permissions.filter(p => p.parentKey !== null)) {
      const parentId = permIds[perm.parentKey!];
      if (!parentId) continue; // parent not yet inserted, will handle in next pass
      const id = uuidv4();
      permIds[perm.key] = id;
      await qr.query(`
        INSERT INTO sys_permission (id, name, code, type, path, component, icon, sort_order, is_visible, status, parent_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 1, $9, NOW(), NOW())
      `, [id, perm.name, perm.code, perm.type, perm.path, perm.component, perm.icon, perm.sortOrder, parentId]);
    }

    // Second pass for any remaining (button-level permissions whose parents were inserted above)
    for (const perm of permissions.filter(p => p.parentKey !== null && !permIds[p.key])) {
      const parentId = permIds[perm.parentKey!];
      if (!parentId) { console.warn('Missing parent for: ' + perm.key); continue; }
      const id = uuidv4();
      permIds[perm.key] = id;
      await qr.query(`
        INSERT INTO sys_permission (id, name, code, type, path, component, icon, sort_order, is_visible, status, parent_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 1, $9, NOW(), NOW())
      `, [id, perm.name, perm.code, perm.type, perm.path, perm.component, perm.icon, perm.sortOrder, parentId]);
    }

    console.log('✅ 权限菜单树已创建 (' + Object.keys(permIds).length + ' 个节点)');

    // ====== 3. 创建超级管理员角色 ======
    const roleId = uuidv4();
    await qr.query(`
      INSERT INTO sys_role (id, code, name, data_scope, sort_order, status, is_system, remark, created_at, updated_at)
      VALUES ($1, 'SUPER_ADMIN', '超级管理员', 1, 1, 1, true, '系统内置超级管理员角色，拥有所有权限', NOW(), NOW())
    `, [roleId]);
    console.log('✅ 超级管理员角色已创建');

    // ====== 4. 为超管角色分配所有权限 ======
    for (const [, permId] of Object.entries(permIds)) {
      const rpId = uuidv4();
      await qr.query(`
        INSERT INTO sys_role_permission (id, role_id, permission_id, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
      `, [rpId, roleId, permId]);
    }
    console.log('✅ 超管角色已分配全部权限');

    // ====== 5. 创建超级管理员用户 ======
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await qr.query(`
      INSERT INTO sys_user (id, username, password, real_name, employee_no, email, phone, gender, status, is_super_admin, organization_id, created_at, updated_at)
      VALUES ($1, 'admin', $2, '系统管理员', 'IPOC0001', 'admin@ipoc.org', '13800000000', 1, 1, true, $3, NOW(), NOW())
    `, [userId, hashedPassword, orgId]);
    console.log('✅ 超级管理员用户已创建');

    // ====== 6. 用户-角色关联 ======
    await qr.query(`
      INSERT INTO sys_user_role (user_id, role_id)
      VALUES ($1, $2)
    `, [userId, roleId]);
    console.log('✅ 用户-角色关联已建立');

    // ====== 7. 初始化数据字典 ======
    const dictTypes = [
      { code: 'gender', name: '性别', items: [{ label: '未知', value: '0', sort: 0 }, { label: '男', value: '1', sort: 1 }, { label: '女', value: '2', sort: 2 }] },
      { code: 'user_status', name: '用户状态', items: [{ label: '停用', value: '0', sort: 0 }, { label: '启用', value: '1', sort: 1 }, { label: '锁定', value: '2', sort: 2 }] },
      { code: 'org_type', name: '组织类型', items: [{ label: '总部', value: '1', sort: 1 }, { label: '大区', value: '2', sort: 2 }, { label: '省级分会', value: '3', sort: 3 }, { label: '市级分会', value: '4', sort: 4 }, { label: '区县分会', value: '5', sort: 5 }] },
      { code: 'data_scope', name: '数据范围', items: [{ label: '全部数据', value: '1', sort: 1 }, { label: '本组织及下级', value: '2', sort: 2 }, { label: '仅本组织', value: '3', sort: 3 }, { label: '仅本人', value: '4', sort: 4 }, { label: '自定义', value: '5', sort: 5 }] },
    ];

    for (const dt of dictTypes) {
      const dtId = uuidv4();
      await qr.query(`
        INSERT INTO sys_dict_type (id, code, name, status, created_at, updated_at)
        VALUES ($1, $2, $3, 1, NOW(), NOW())
      `, [dtId, dt.code, dt.name]);
      for (const item of dt.items) {
        const ddId = uuidv4();
        await qr.query(`
          INSERT INTO sys_dict_data (id, dict_type_id, label, value, sort_order, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
        `, [ddId, dtId, item.label, item.value, item.sort]);
      }
    }
    console.log('✅ 数据字典已初始化');

    // ====== 8. 初始化系统配置 ======
    const configs = [
      { key: 'sys.name', name: '系统名称', value: 'IPOC管控系统' },
      { key: 'sys.login.maxRetry', name: '最大登录重试次数', value: '5' },
      { key: 'sys.login.lockMinutes', name: '登录锁定时长(分钟)', value: '30' },
      { key: 'sys.password.minLength', name: '密码最小长度', value: '6' },
    ];
    for (const c of configs) {
      const cId = uuidv4();
      await qr.query(`
        INSERT INTO sys_config (id, config_key, config_name, config_value, is_system, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      `, [cId, c.key, c.name, c.value]);
    }
    console.log('✅ 系统配置已初始化');

    await qr.commitTransaction();

    console.log('');
    console.log('🎉 ============================');
    console.log('   种子数据初始化完成！');
    console.log('   超管账号: admin');
    console.log('   超管密码: admin123');
    console.log('🎉 ============================');

  } catch (error) {
    await qr.rollbackTransaction();
    console.error('❌ 种子数据初始化失败:', error);
    throw error;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
