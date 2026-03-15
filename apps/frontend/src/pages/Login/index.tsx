import React from 'react';
import { LockOutlined, UserOutlined, SafetyCertificateOutlined, GlobalOutlined, TeamOutlined, FundOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText, ProFormCheckbox } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { message, Typography, Space } from 'antd';
import { request } from '@umijs/max';

const { Text, Title } = Typography;

const features = [
  { icon: <SafetyCertificateOutlined />, title: 'RBAC 权限体系', desc: '多角色精细化权限与数据隔离' },
  { icon: <GlobalOutlined />, title: '全国分会管理', desc: '无限极组织架构与属地化管控' },
  { icon: <FundOutlined />, title: '财务内控中心', desc: '预算风控、凭证闭环与智能分账' },
  { icon: <TeamOutlined />, title: '赛事协同指挥', desc: 'SOP 标准化管控与 BI 决策大屏' },
];

const Login: React.FC = () => {
  const { setInitialState } = useModel('@@initialState');

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      const res = await request('/auth/login', { method: 'POST', data: values });
      const payload = res?.data || res; // 兼容 umi request 解包
      const tokenData = payload?.data || payload; // 兼容 {code,data} 和直接返回
      if (tokenData?.accessToken) {
        localStorage.setItem('accessToken', tokenData.accessToken);
        localStorage.setItem('refreshToken', tokenData.refreshToken);
        message.success('登录成功，欢迎回来 ' + (tokenData.userInfo?.realName || ''));
        // 先设 token 再刷新 initialState，最后跳转
        await setInitialState((s: any) => ({ ...s, currentUser: tokenData.userInfo }));
        // 使用 location.href 确保跳转生效
        window.location.href = '/dashboard';
      } else {
        message.error(payload?.message || '登录失败');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || '登录失败，请检查账号或密码');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* 左侧品牌区 */}
      <div style={{
        flex: 1, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '60px 40px', color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05,
          backgroundImage: 'radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px), radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
            <span role="img" aria-label="pet">&#x1F3C6;</span>
          </div>
          <Title level={2} style={{ color: '#fff', marginBottom: 8, letterSpacing: 2 }}>IPOC</Title>
          <Title level={4} style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 400, marginBottom: 40, lineHeight: 1.6 }}>
            国际宠物奥林匹克超级赛<br />组委会内部数字化管控系统
          </Title>
          <div style={{ textAlign: 'left' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20, padding: '12px 16px',
                background: 'rgba(255,255,255,0.08)', borderRadius: 8, backdropFilter: 'blur(10px)',
              }}>
                <div style={{ fontSize: 22, marginRight: 14, marginTop: 2, color: '#53c0f0' }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          &copy; {new Date().getFullYear()} IPOC 组委会 &middot; 内部系统 &middot; 严禁外传
        </div>
      </div>

      {/* 右侧登录区 */}
      <div style={{
        width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', background: '#fff', padding: '40px 60px',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
      }}>
        <LoginForm
          title="系统登录"
          subTitle="请使用管理员分配的账号登录"
          onFinish={handleSubmit}
          style={{ maxWidth: 360, width: '100%' }}
        >
          <ProFormText
            name="username"
            fieldProps={{ size: 'large', prefix: <UserOutlined style={{ color: '#1890ff' }} /> }}
            placeholder="请输入账号"
            rules={[{ required: true, message: '请输入账号' }]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{ size: 'large', prefix: <LockOutlined style={{ color: '#1890ff' }} /> }}
            placeholder="请输入密码"
            rules={[{ required: true, message: '请输入密码' }]}
          />
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <ProFormCheckbox noStyle name="autoLogin">记住登录状态</ProFormCheckbox>
            <Text type="secondary" style={{ fontSize: 12 }}>忘记密码请联系管理员</Text>
          </div>
        </LoginForm>
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>V1.0 &middot; Powered by IPOC Tech</Text>
        </div>
      </div>
    </div>
  );
};

export default Login;
