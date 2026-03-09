import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Button, Space, Modal, Form, Input, Select, InputNumber, Switch, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import * as permApi from '@/services/permission';

const typeMap: Record<number, { text: string; color: string }> = {
  1: { text: '目录', color: 'blue' }, 2: { text: '菜单', color: 'green' },
  3: { text: '按钮', color: 'orange' }, 4: { text: '数据权限', color: 'purple' },
};

const PermissionPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await permApi.getPermissionTree();
    setTreeData(res.data || []);
    setLoading(false);
  };
  useEffect(() => { loadData(); }, []);

  const columns: any[] = [
    { title: '权限名称', dataIndex: 'name', width: 200 },
    { title: '权限标识', dataIndex: 'code', width: 200 },
    { title: '类型', dataIndex: 'type', width: 80, render: (v: number) => { const t = typeMap[v]; return t ? <Tag color={t.color}>{t.text}</Tag> : v; } },
    { title: '路由路径', dataIndex: 'path', width: 200, ellipsis: true },
    { title: '排序', dataIndex: 'sortOrder', width: 60 },
    { title: '可见', dataIndex: 'isVisible', width: 60, render: (v: boolean) => v ? '是' : '否' },
    {
      title: '操作', width: 200,
      render: (_: any, record: any) => (
        <Space>
          <a onClick={() => { form.resetFields(); form.setFieldsValue({ parentId: record.id }); setEditing(null); setModalVisible(true); }}>添加子项</a>
          <a onClick={() => { setEditing(record); form.setFieldsValue(record); setModalVisible(true); }}>编辑</a>
          <Popconfirm title="确认删除?" onConfirm={async () => { await permApi.deletePermission(record.id); message.success('已删除'); loadData(); }}>
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增根权限</Button>
        </Space>
        <Table rowKey="id" columns={columns} dataSource={treeData} loading={loading} pagination={false} defaultExpandAllRows size="small" />
      </Card>
      <Modal title={editing ? '编辑权限' : '新增权限'} open={modalVisible} onOk={async () => {
        const values = await form.validateFields();
        if (editing) { await permApi.updatePermission(editing.id, values); message.success('更新成功'); }
        else { await permApi.createPermission(values); message.success('创建成功'); }
        setModalVisible(false); loadData();
      }} onCancel={() => setModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="权限名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="权限标识" rules={[{ required: true }]}><Input placeholder="如 system:user:create" /></Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={Object.entries(typeMap).map(([k, v]) => ({ value: Number(k), label: v.text }))} />
          </Form.Item>
          <Form.Item name="path" label="路由路径"><Input /></Form.Item>
          <Form.Item name="component" label="组件路径"><Input /></Form.Item>
          <Form.Item name="icon" label="图标"><Input /></Form.Item>
          <Form.Item name="sortOrder" label="排序号"><InputNumber min={0} /></Form.Item>
          <Form.Item name="isVisible" label="是否可见" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="parentId" label="父权限ID"><Input disabled /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PermissionPage;
