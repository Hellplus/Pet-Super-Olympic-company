import React, { useEffect, useState, useCallback, useRef } from 'react';
import { RequestConfig, RunTimeLayoutConfig, history } from '@umijs/max';
import { message, Dropdown, Avatar, Space, Typography, Badge, Tooltip, List, Tag, Empty, Spin } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, BellOutlined, RightOutlined } from '@ant-design/icons';

const { Text } = Typography;

const publicPaths = ['/login', '/public/'];

// Token 自动刷新
let isRefreshing = false;
let pendingRequests: (() => void)[] = [];

async function refreshToken(): Promise<boolean> {
  const refreshTokenStr = localStorage.getItem('refreshToken');
  if (!refreshTokenStr) return false;
  try {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTokenStr }),
    });
    if (res.ok) {
      const data = await res.json();
      const tokenData = data?.data || data;
      if (tokenData?.accessToken) {
        localStorage.setItem('accessToken', tokenData.accessToken);
        if (tokenData.refreshToken) {
          localStorage.setItem('refreshToken', tokenData.refreshToken);
        }
        return true;
      }
    }
  } catch {}
  return false;
}

// 全局初始化数据
export async function getInitialState() {
  const isPublic = publicPaths.some((p) => location.pathname.startsWith(p));
  const token = localStorage.getItem('accessToken');
  if (!token && !isPublic) {
    history.push('/login');
    return { currentUser: null };
  }
  if (token) {
    try {
      const res = await fetch('/api/v1/auth/profile', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        const data = await res.json();
        return { currentUser: data.data };
      }
      // Token 过期，尝试刷新
      if (res.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          const newToken = localStorage.getItem('accessToken');
          const retryRes = await fetch('/api/v1/auth/profile', {
            headers: { Authorization: 'Bearer ' + newToken },
          });
          if (retryRes.ok) {
            const data = await retryRes.json();
            return { currentUser: data.data };
          }
        }
        // 刷新也失败
        if (!isPublic) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          history.push('/login');
        }
      }
    } catch {}
  }
  return { currentUser: null };
}

/** 通知铃铛组件 - 实时轮询 + 下拉预览 */
const NotificationBell: React.FC = () => {
  const [count, setCount] = useState(0);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<any>(null);

  // 轮询获取通知计数
  const fetchCount = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch('/api/v1/dashboard/notification-count', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        const data = await res.json();
        const d = data?.data || data;
        setCount(Number(d?.total) || 0);
        setDetail(d);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchCount();
    timerRef.current = setInterval(fetchCount, 60000); // 60秒轮询
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchCount]);

  const items = [];
  if (detail) {
    const entries = [
      { key: 'pendingExpenses', label: '待审批报销', color: 'orange', link: '/finance/expense' },
      { key: 'pendingBudgets', label: '待审批预算', color: 'blue', link: '/finance/budget' },
      { key: 'pendingApplications', label: '入驻待审', color: 'purple', link: '/branch-hr/application' },
      { key: 'overdueTasks', label: '逾期任务', color: 'red', link: '/event/sop-progress' },
      { key: 'unpaidSettlements', label: '清算待缴', color: 'volcano', link: '/finance/settlement' },
      { key: 'certWarnings', label: '证书预警', color: 'gold', link: '/branch-hr/cert-warning' },
      { key: 'contractExpiry', label: '合同到期', color: 'magenta', link: '/sponsorship/contracts' },
      { key: 'unreadAnnouncements', label: '未读公告', color: 'cyan', link: '/event/announcement' },
    ];
    entries.forEach((e) => {
      const val = Number(detail[e.key]) || 0;
      if (val > 0) {
        items.push({
          key: e.key,
          label: (
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 200, padding: '4px 0' }}
              onClick={() => { history.push(e.link); setOpen(false); }}
            >
              <span><Tag color={e.color} style={{ marginRight: 4 }}>{e.label}</Tag></span>
              <Badge count={val} style={{ marginLeft: 8 }} />
            </div>
          ),
        });
      }
    });
  }
  items.push({ type: 'divider' as const, key: 'divider' });
  items.push({
    key: 'viewAll',
    label: (
      <div
        style={{ textAlign: 'center', color: '#1890ff', cursor: 'pointer' }}
        onClick={() => { history.push('/todo-center'); setOpen(false); }}
      >
        查看全部待办 <RightOutlined />
      </div>
    ),
  });

  return (
    <Dropdown
      menu={{ items }}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Tooltip title={count > 0 ? `${count} 项待处理` : '暂无待办'}>
        <Badge count={count} size="small" offset={[-2, 2]}>
          <BellOutlined
            style={{ fontSize: 18, cursor: 'pointer', color: count > 0 ? '#1890ff' : 'rgba(0,0,0,0.45)' }}
          />
        </Badge>
      </Tooltip>
    </Dropdown>
  );
};

// 布局配置
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => ({
  rightContentRender: () => {
    const user = initialState?.currentUser;
    if (!user) return null;
    const menuItems = [
      { key: 'profile', icon: <UserOutlined />, label: user.realName || user.username },
      { key: 'settings', icon: <SettingOutlined />, label: '个人中心' },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ];
    return (
      <Space size={16}>
        <NotificationBell />
        <Dropdown menu={{
          items: menuItems,
          onClick: ({ key }) => {
            if (key === 'settings') {
              history.push('/account/settings');
            } else if (key === 'logout') {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              setInitialState((s: any) => ({ ...s, currentUser: null }));
              history.push('/login');
              message.success('已退出登录');
            }
          },
        }}>
          <Space style={{ cursor: 'pointer', padding: '0 12px' }}>
            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <Text style={{ maxWidth: 100, color: 'rgba(0,0,0,0.65)' }} ellipsis>
              {user.realName || user.username}
            </Text>
          </Space>
        </Dropdown>
      </Space>
    );
  },
  waterMarkProps: { content: initialState?.currentUser?.realName },
  onPageChange: () => {
    const isPublic = publicPaths.some((p) => location.pathname.startsWith(p));
    if (!initialState?.currentUser && !isPublic) {
      history.push('/login');
    }
  },
  menuHeaderRender: undefined,
  breakpoint: 'lg',
  collapsedButtonRender: undefined,
  defaultCollapsed: typeof window !== 'undefined' && window.innerWidth < 992,
  token: {
    header: { colorBgHeader: '#fff', colorHeaderTitle: '#1a1a2e' },
    sider: { colorMenuBackground: '#fff', colorTextMenu: '#595959', colorTextMenuSelected: '#1890ff', colorBgMenuItemSelected: '#e6f7ff' },
  },
});

// 请求配置 - 含 Token 自动刷新
export const request: RequestConfig = {
  baseURL: '/api/v1',
  timeout: 30000,
  requestInterceptors: [
    (config: any) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers = { ...config.headers, Authorization: 'Bearer ' + token };
      }
      return config;
    },
  ],
  responseInterceptors: [
    (response: any) => {
      const { data } = response;
      // 仅对包含 code 字段的标准响应做错误提示，避免误判文件下载等场景
      if (data && typeof data === 'object' && 'code' in data && data.code !== 200) {
        message.error(data.message || '请求失败');
      }
      return response;
    },
  ],
  errorConfig: {
    errorHandler: async (error: any) => {
      const { response } = error || {};
      if (response?.status === 401) {
        // 避免并发刷新
        if (!isRefreshing) {
          isRefreshing = true;
          const refreshed = await refreshToken();
          isRefreshing = false;

          if (refreshed) {
            // 刷新成功，重试挂起的请求
            pendingRequests.forEach((cb) => cb());
            pendingRequests = [];
            // 当前请求无法自动重试，提示用户刷新
            message.info('登录已续期，请重新操作');
            return;
          }
        }
        // 刷新失败，跳转登录
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        history.push('/login');
        message.warning('登录已过期，请重新登录');
      } else if (response?.status === 403) {
        message.error('无权限执行此操作');
      } else if (response?.status >= 500) {
        message.error('服务器异常，请稍后重试');
      }
    },
  },
};
