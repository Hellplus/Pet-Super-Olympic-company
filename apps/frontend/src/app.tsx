import { RequestConfig, RunTimeLayoutConfig, history } from '@umijs/max';
import { message } from 'antd';

// 全局初始化数据
export async function getInitialState() {
  const token = localStorage.getItem('accessToken');
  if (!token && location.pathname !== '/login') {
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
    } catch {}
  }
  return { currentUser: null };
}

// 布局配置
export const layout: RunTimeLayoutConfig = ({ initialState }) => ({
  rightContentRender: () => null,
  waterMarkProps: { content: initialState?.currentUser?.realName },
  onPageChange: () => {
    if (!initialState?.currentUser && location.pathname !== '/login') {
      history.push('/login');
    }
  },
  menuHeaderRender: undefined,
});

// 请求配置
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
      if (data?.code !== 200) {
        message.error(data?.message || '请求失败');
      }
      return response;
    },
  ],
  errorConfig: {
    errorHandler: (error: any) => {
      if (error?.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        history.push('/login');
      }
    },
  },
};
