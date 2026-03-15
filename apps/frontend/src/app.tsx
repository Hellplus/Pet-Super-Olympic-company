import React from 'react';
import { RequestConfig, RunTimeLayoutConfig, history } from '@umijs/max';
import { message, Dropdown, Avatar, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';

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

// 布局配置
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => ({
  rightContentRender: () => {
    const user = initialState?.currentUser;
    if (!user) return null;
    const menuItems = [
      { key: 'profile', icon: <UserOutlined />, label: user.realName || user.username },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ];
    return (
      <Dropdown menu={{
        items: menuItems,
        onClick: ({ key }) => {
          if (key === 'logout') {
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
