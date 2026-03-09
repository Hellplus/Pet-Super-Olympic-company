import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Button, message, Popconfirm, Space, Tag, Modal, Form, Input, DatePicker } from 'antd';
import { PlusOutlined, StopOutlined } from '@ant-design/icons';
import * as api from '@/services/sponsorship';

const ProtectedCategoryPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const load = async () => { setLoading(true); const res = await api.getProtectedCategories(); setData(res.data || []); setLoading(false); };
  useEffect(() => { load(); }, []);

  const columns = [
    { title: '品类名称', dataIndex: 'categoryName', width: 200 },
    { title: '独家保护品牌', dataIndex: 'brandName', width: 200 },
    { title: '保护范围', dataIndex: 'protectionScope', width: 100, render: (v: string) => v === 'GLOBAL' ? <Tag color="red">全球</Tag> : <Tag>区域</Tag> },
    { title: '关联合同', dataIndex: 'contractNo', width: 150 },
    { title: '到期日', dataIndex: 'expireDate', width: 120 },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: number) => <Tag color={v === 1 ? 'red' : 'default'}>{v === 1 ? '生效中' : '已过期'}</Tag> },
    { title: '操作', width: 100, render: (_: any, r: any) => (
      <Popconfirm title="确认解除保护?" onConfirm={async () => { await api.deleteProtectedCategory(r.id); message.success('已解除'); load(); }}>
        <Button size="small" danger icon={<StopOutlined />}>解除</Button>
      </Popconfirm>
    )},
  ];

  return (
    <PageContainer>
      <Card>
        <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }}
          onClick={() => { form.resetFields(); setModalVisible(true); }}>新增受保护品类</Button>
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading} size="small" />
      </Card>
      <Modal title="新增受保护品类" open={modalVisible} onOk={async () => {
        const values = await form.validateFields();
        await api.createProtectedCategory(values); message.success('已添加'); setModalVisible(false); load();
      }} onCancel={() => setModalVisible(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="categoryName" label="品类名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="brandName" label="独家保护品牌"><Input /></Form.Item>
          <Form.Item name="contractNo" label="关联合同编号"><Input /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};
export default ProtectedCategoryPage;
