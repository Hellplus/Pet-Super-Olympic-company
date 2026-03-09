import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormDigit, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag, Modal, Tree } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import * as roleApi from '@/services/role';
import * as permApi from '@/services/permission';

const dataScopeMap: Record<number, string> = { 1: '全部数据', 2: '本组织及下级', 3: '仅本组织', 4: '仅本人', 5: '自定义' };

const RolePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [permModalVisible, setPermModalVisible] = useState(false);
  const [permTree, setPermTree] = useState<any[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [currentRoleId, setCurrentRoleId] = useState('');

  const columns: ProColumns[] = [
    { title: '角色编码', dataIndex: 'code', width: 150 },
    { title: '角色名称', dataIndex: 'name', width: 150 },
    { title: '数据范围', dataIndex: 'dataScope', width: 120, hideInSearch: true, render: (_, r) => dataScopeMap[r.dataScope] || '未知' },
    { title: '状态', dataIndex: 'status', width: 80, render: (_, r) => <Tag color={r.status === 1 ? 'green' : 'red'}>{r.status === 1 ? '启用' : '停用'}</Tag>, valueEnum: { 1: { text: '启用' }, 0: { text: '停用' } } },
    { title: '系统内置', dataIndex: 'isSystem', width: 80, hideInSearch: true, render: (_, r) => r.isSystem ? <Tag color="blue">是</Tag> : '否' },
    { title: '备注', dataIndex: 'remark', hideInSearch: true, ellipsis: true },
    {
      title: '操作', width: 250, valueType: 'option',
      render: (_, record) => (
        <Space>
          <a onClick={() => { setEditingRole(record); setModalVisible(true); }}>编辑</a>
          <a onClick={async () => {
            setCurrentRoleId(record.id);
            const [treeRes, idsRes] = await Promise.all([permApi.getPermissionTree(), roleApi.getRolePermissionIds(record.id)]);
            setPermTree(treeRes.data || []);
            setCheckedKeys(idsRes.data || []);
            setPermModalVisible(true);
          }}><SettingOutlined /> 分配权限</a>
          {!record.isSystem && (
            <Popconfirm title="确认删除?" onConfirm={async () => { await roleApi.deleteRole(record.id); message.success('已删除'); actionRef.current?.reload(); }}>
              <a style={{ color: 'red' }}>删除</a>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const convertPermTree = (nodes: any[]): any[] =>
    nodes.map((n) => ({ title: n.name, key: n.id, children: n.children ? convertPermTree(n.children) : [] }));

  return (
    <PageContainer>
      <ProTable
        headerTitle="角色列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await roleApi.getRoles({ ...params, page: params.current, pageSize: params.pageSize });
          return { data: res.data?.items || [], total: res.data?.total || 0, success: true };
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRole(null); setModalVisible(true); }}>新增角色</Button>,
        ]}
      />
      <ModalForm
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={editingRole || {}}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          if (editingRole) { await roleApi.updateRole(editingRole.id, values); message.success('更新成功'); }
          else { await roleApi.createRole(values); message.success('创建成功'); }
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="code" label="角色编码" rules={[{ required: true }]} disabled={!!editingRole} />
        <ProFormText name="name" label="角色名称" rules={[{ required: true }]} />
        <ProFormSelect name="dataScope" label="数据范围" valueEnum={dataScopeMap} rules={[{ required: true }]} />
        <ProFormDigit name="sortOrder" label="排序号" min={0} />
        <ProFormTextArea name="remark" label="备注" />
      </ModalForm>
      <Modal title="分配权限" open={permModalVisible} width={600} onCancel={() => setPermModalVisible(false)}
        onOk={async () => {
          await roleApi.assignPermissions(currentRoleId, checkedKeys);
          message.success('权限分配成功');
          setPermModalVisible(false);
        }}>
        <Tree checkable defaultExpandAll treeData={convertPermTree(permTree)} checkedKeys={checkedKeys}
          onCheck={(checked: any) => setCheckedKeys(checked as string[])} />
      </Modal>
    </PageContainer>
  );
};

export default RolePage;
