import React from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { message } from 'antd';
import { request } from '@umijs/max';

const Login: React.FC = () => {
  const { setInitialState } = useModel('@@initialState');

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      const res = await request('/auth/login', { method: 'POST', data: values });
      if (res.code === 200) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        await setInitialState((s: any) => ({ ...s, currentUser: res.data.userInfo }));
        message.success('登录成功');
        history.push('/dashboard');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || '登录失败');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <LoginForm
        title="IPOC管控系统"
        subTitle="国际宠物奥林匹克超级赛组委会内部数字化管控系统"
        onFinish={handleSubmit}
      >
        <ProFormText
          name="username"
          fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
          placeholder="请输入账号"
          rules={[{ required: true, message: '请输入账号' }]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
          placeholder="请输入密码"
          rules={[{ required: true, message: '请输入密码' }]}
        />
      </LoginForm>
    </div>
  );
};

export default Login;
