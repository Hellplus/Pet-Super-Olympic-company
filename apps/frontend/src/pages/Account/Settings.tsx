import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, message, Divider, Avatar, Row, Col, Descriptions, Spin } from 'antd';
import { UserOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { useModel, request } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';

const genderOptions = [
  { value: 0, label: '未知' },
  { value: 1, label: '男' },
  { value: 2, label: '女' },
];

const Settings: React.FC = () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const [profileForm] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await request('/auth/profile');
      const user = res?.data || res;
      setProfileData(user);
      profileForm.setFieldsValue({
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        gender: user.gender ?? 0,
      });
    } catch {}
  };

  const handleProfileSave = async (values: any) => {
    setLoading(true);
    try {
      await request('/auth/profile', { method: 'PUT', data: values });
      message.success('个人信息已更新');
      // 刷新全局状态
      const res = await request('/auth/profile');
      const user = res?.data || res;
      setProfileData(user);
      setInitialState((s: any) => ({ ...s, currentUser: user }));
    } catch {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    setPwdLoading(true);
    try {
      await request('/auth/change-password', { method: 'POST', data: values });
      message.success('密码修改成功，请重新登录');
      pwdForm.resetFields();
      // 清除token并跳转登录
      setTimeout(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }, 1500);
    } catch {
      message.error('密码修改失败，请检查旧密码是否正确');
    } finally {
      setPwdLoading(false);
    }
  };

  const user = profileData || initialState?.currentUser;

  return (
    <PageContainer title="个人中心" subTitle="管理您的账号信息和安全设置">
      <Row gutter={24}>
        {/* 左侧 - 个人信息卡片 */}
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Avatar size={80} icon={<UserOutlined />} src={user?.avatar} style={{ backgroundColor: '#1890ff' }} />
              <h2 style={{ marginTop: 16, marginBottom: 4 }}>{user?.realName || user?.username}</h2>
              <p style={{ color: '#999' }}>{user?.position || '暂无职位'}</p>
            </div>
            <Divider />
            {user && (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="账号">{user.username}</Descriptions.Item>
                <Descriptions.Item label="工号">{user.employeeNo || '-'}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{user.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="手机">{user.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="角色">
                  {user.isSuperAdmin ? '超级管理员' : (user.roles?.map((r: any) => r.name).join('、') || '-')}
                </Descriptions.Item>
                <Descriptions.Item label="最后登录">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '-'}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>

        {/* 右侧 - 编辑区 */}
        <Col xs={24} md={16}>
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <Form form={profileForm} layout="vertical" onFinish={handleProfileSave} style={{ maxWidth: 500 }}>
              <Form.Item name="realName" label="真实姓名" rules={[{ required: true, message: '请输入真实姓名' }]}>
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
              <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}>
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
              <Form.Item name="gender" label="性别">
                <Select options={genderOptions} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card title="修改密码">
            <Form form={pwdForm} layout="vertical" onFinish={handlePasswordChange} style={{ maxWidth: 500 }}>
              <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
              </Form.Item>
              <Form.Item name="newPassword" label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码长度不能少于6位' },
                ]}>
                <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码（至少6位）" />
              </Form.Item>
              <Form.Item name="confirmPassword" label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}>
                <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={pwdLoading} danger icon={<LockOutlined />}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Settings;
