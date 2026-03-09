import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import * as userApi from '@/services/user';
import * as roleApi from '@/services/role';

const statusMap: Record<number, { text: string; color: string }> = {
  1: { text: '正常', color: 'green' },
  0: { text: '停用', color: 'red' },
  2: { text: '锁定', color: 'orange' },
};

const UserPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const columns: ProColumns[] = [
    { title: '账号', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'realName', width: 100 },
    { title: '手机号', dataIndex: 'phone', width: 130, hideInSearch: true },
    { title: '所属组织', dataIndex: ['organization', 'name'], width: 150, hideInSearch: true },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (_, record) => {
        const s = statusMap[record.status] || { text: '未知', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
      valueEnum: { 1: { text: '正常' }, 0: { text: '停用' }, 2: { text: '锁定' } },
    },
    {
      title: '角色', dataIndex: 'roles', width: 200, hideInSearch: true,
      render: (_, record) => record.roles?.map((r: any) => <Tag key={r.id}>{r.name}</Tag>),
    },
    { title: '最后登录', dataIndex: 'lastLoginAt', valueType: 'dateTime', width: 170, hideInSearch: true },
    {
      title: '操作', width: 200, valueType: 'option',
      render: (_, record) => (
        <Space>
          <a onClick={() => { setEditingUser(record); setModalVisible(true); }}>编辑</a>
          {record.status === 1 ? (
            <Popconfirm title="确认封停?" onConfirm={async () => { await userApi.disableUser(record.id); message.success('已封停'); actionRef.current?.reload(); }}>
              <a style={{ color: 'orange' }}>封停</a>
            </Popconfirm>
          ) : (
            <a onClick={async () => { await userApi.enableUser(record.id); message.success('已启用'); actionRef.current?.reload(); }}>启用</a>
          )}
          {!record.isSuperAdmin && (
            <Popconfirm title="确认删除?" onConfirm={async () => { await userApi.deleteUser(record.id); message.success('已删除'); actionRef.current?.reload(); }}>
              <a style={{ color: 'red' }}>删除</a>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable
        headerTitle="用户列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await userApi.getUsers({ ...params, page: params.current, pageSize: params.pageSize });
          return { data: res.data?.items || [], total: res.data?.total || 0, success: true };
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingUser(null); setModalVisible(true); }}>新增用户</Button>,
        ]}
      />
      <ModalForm
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={editingUser || { password: '123456' }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          if (editingUser) {
            await userApi.updateUser(editingUser.id, values);
            message.success('更新成功');
          } else {
            await userApi.createUser(values);
            message.success('创建成功');
          }
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="username" label="登录账号" rules={[{ required: true }]} disabled={!!editingUser} />
        {!editingUser && <ProFormText.Password name="password" label="初始密码" rules={[{ required: true }]} />}
        <ProFormText name="realName" label="真实姓名" rules={[{ required: true }]} />
        <ProFormText name="phone" label="手机号" />
        <ProFormText name="email" label="邮箱" />
        <ProFormText name="position" label="职位" />
        <ProFormSelect name="gender" label="性别" valueEnum={{ 0: '未知', 1: '男', 2: '女' }} />
      </ModalForm>
    </PageContainer>
  );
};

export default UserPage;
