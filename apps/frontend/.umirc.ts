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
    {
      name: '分会与人事',
      path: '/branch-hr',
      icon: 'BankOutlined',
      routes: [
        { name: '入驻申请', path: '/branch-hr/application', component: './BranchHr/Application' },
        { name: '专业人才库', path: '/branch-hr/expert', component: './BranchHr/Expert' },
      ],
    },
    {
      name: '财务内控',
      path: '/finance',
      icon: 'AccountBookOutlined',
      routes: [
        { name: '收款登记', path: '/finance/revenue', component: './Finance/Revenue' },
        { name: '预算管理', path: '/finance/budget', component: './Finance/Budget' },
        { name: '报销/付款', path: '/finance/expense', component: './Finance/Expense' },
        { name: '清算账单', path: '/finance/settlement', component: './Finance/Settlement' },
      ],
    },
    {
      name: '招商合规',
      path: '/sponsorship',
      icon: 'ShopOutlined',
      routes: [
        { name: '品类保护', path: '/sponsorship/protected-category', component: './Sponsorship/ProtectedCategory' },
        { name: '客户管理', path: '/sponsorship/client', component: './Sponsorship/Client' },
        { name: '赞助合同', path: '/sponsorship/contract', component: './Sponsorship/Contract' },
        { name: '权益交付', path: '/sponsorship/delivery', component: './Sponsorship/Delivery' },
        { name: '结案报告', path: '/sponsorship/report', component: './Sponsorship/Report' },
      ],
    },
    {
      name: '赛事管理',
      path: '/event',
      icon: 'TrophyOutlined',
      routes: [
        { name: '赛事列表', path: '/event/list', component: './Event/EventList' },
        { name: 'SOP模板', path: '/event/sop-template', component: './Event/SopTemplate' },
        { name: '内部公告', path: '/event/announcement', component: './Event/Announcement' },
        { name: 'IP数字资产', path: '/event/digital-asset', component: './Event/DigitalAsset' },
      ],
    },
  ],
});
