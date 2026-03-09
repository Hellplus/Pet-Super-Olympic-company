import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'IPOC管控系统',
    locale: false,
  },
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
  routes: [
    { path: '/login', component: './Login', layout: false },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      name: '工作台',
      path: '/dashboard',
      component: './Dashboard',
      icon: 'DashboardOutlined',
    },
    {
      name: '系统管理',
      path: '/system',
      icon: 'SettingOutlined',
      access: 'canAdmin',
      routes: [
        { name: '用户管理', path: '/system/user', component: './System/User' },
        { name: '角色管理', path: '/system/role', component: './System/Role' },
        { name: '权限管理', path: '/system/permission', component: './System/Permission' },
        { name: '组织架构', path: '/system/organization', component: './System/Organization' },
        { name: '数据字典', path: '/system/dict', component: './System/Dict' },
        { name: '审计日志', path: '/system/audit-log', component: './System/AuditLog' },
        { name: '系统配置', path: '/system/config', component: './System/Config' },
      ],
    },
  ],
});
