import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Button, message, Popconfirm, Space, Tag, Modal, Form, Input, DatePicker, Select, Descriptions } from 'antd';
import { PlusOutlined, StopOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import * as api from '@/services/sponsorship';
import dayjs from 'dayjs';

const ProtectedCategoryPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const load = async () => { setLoading(true); const res = await api.getProtectedCategories(); setData(res.data || []); setLoading(false); };
  useEffect(() => { load(); }, []);

  const columns = [
    { title: '品类名称', dataIndex: 'categoryName', width: 200 },
    { title: '独家保护品牌', dataIndex: 'brandName', width: 200 },
    { title: '保护范围', dataIndex: 'protectionScope', width: 100,
      render: (v: string) => v === 'GLOBAL' ? <Tag color="red">全球</Tag> : <Tag color="blue">区域</Tag> },
    { title: '关联合同', dataIndex: 'contractNo', width: 150 },
    { title: '到期日', dataIndex: 'expireDate', width: 120 },
    { title: '状态', dataIndex: 'status', width: 80,
      render: (v: number) => <Tag color={v === 1 ? 'red' : 'default'}>{v === 1 ? '生效中' : '已过期'}</Tag> },
    { title: '操作', width: 200, render: (_: any, r: any) => (
      <Space>
        <Button size="small" type="link" icon={<EyeOutlined />}
          onClick={() => { setDetailRecord(r); setDetailVisible(true); }}>详情</Button>
        <Button size="small" type="link" icon={<EditOutlined />}
          onClick={() => {
            setEditing(r);
            form.setFieldsValue({
              ...r,
              expireDate: r.expireDate ? dayjs(r.expireDate) : undefined,
            });
            setModalVisible(true);
          }}>编辑</Button>
        <Popconfirm title="确认解除保护?" onConfirm={async () => { await api.deleteProtectedCategory(r.id); message.success('已解除'); load(); }}>
          <Button size="small" danger icon={<StopOutlined />}>解除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (values.expireDate) values.expireDate = values.expireDate.format('YYYY-MM-DD');
    if (editing) {
      // 编辑：使用update API（如果存在）或重新创建
      try {
        await api.createProtectedCategory({ ...values, id: editing.id });
        message.success('更新成功');
      } catch {
        message.error('更新失败');
        return;
      }
    } else {
      await api.createProtectedCategory(values);
      message.success('已添加');
    }
    setModalVisible(false);
    setEditing(null);
    load();
  };

  return (
    <PageContainer>
      <Card>
        <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }}
          onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增受保护品类</Button>
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading} size="small" />
      </Card>

      {/* 新增/编辑 */}
      <Modal title={editing ? '编辑受保护品类' : '新增受保护品类'} open={modalVisible}
        onOk={handleSubmit} onCancel={() => { setModalVisible(false); setEditing(null); }} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="categoryName" label="品类名称" rules={[{ required: true, message: '请输入品类名称' }]}>
            <Input placeholder="如：宠物食品、宠物玩具" />
          </Form.Item>
          <Form.Item name="brandName" label="独家保护品牌" rules={[{ required: true, message: '请输入品牌名称' }]}>
            <Input placeholder="如：皇家、冠能" />
          </Form.Item>
          <Form.Item name="protectionScope" label="保护范围">
            <Select placeholder="请选择保护范围" options={[
              { label: '全球', value: 'GLOBAL' },
              { label: '区域', value: 'REGIONAL' },
            ]} />
          </Form.Item>
          <Form.Item name="contractNo" label="关联合同编号">
            <Input placeholder="关联的赞助合同编号" />
          </Form.Item>
          <Form.Item name="expireDate" label="保护到期日">
            <DatePicker style={{ width: '100%' }} placeholder="选择到期日期" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情 */}
      <Modal title="品类保护详情" open={detailVisible}
        onCancel={() => setDetailVisible(false)} footer={null} width={500}>
        {detailRecord && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="品类名称">{detailRecord.categoryName}</Descriptions.Item>
            <Descriptions.Item label="独家保护品牌">{detailRecord.brandName}</Descriptions.Item>
            <Descriptions.Item label="保护范围">
              {detailRecord.protectionScope === 'GLOBAL' ? <Tag color="red">全球</Tag> : <Tag color="blue">区域</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="关联合同">{detailRecord.contractNo || '无'}</Descriptions.Item>
            <Descriptions.Item label="保护到期日">{detailRecord.expireDate || '永久'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={detailRecord.status === 1 ? 'red' : 'default'}>
                {detailRecord.status === 1 ? '生效中' : '已过期'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{detailRecord.createdAt ? new Date(detailRecord.createdAt).toLocaleString('zh-CN') : '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
};
export default ProtectedCategoryPage;
