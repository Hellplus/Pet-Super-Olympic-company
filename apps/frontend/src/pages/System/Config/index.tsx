import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Button, Modal, Form, Input, message, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import * as configApi from '@/services/sysConfig';

const ConfigPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const loadData = async () => { setLoading(true); const res = await configApi.getSysConfigs(); setData(res.data || []); setLoading(false); };
  useEffect(() => { loadData(); }, []);

  const columns = [
    { title: '参数键名', dataIndex: 'configKey', width: 200 },
    { title: '参数名称', dataIndex: 'configName', width: 200 },
    { title: '参数值', dataIndex: 'configValue', ellipsis: true },
    { title: '系统内置', dataIndex: 'isSystem', width: 80, render: (v: boolean) => v ? <Tag color="blue">是</Tag> : '否' },
    {
      title: '操作', width: 150,
      render: (_: any, record: any) => (
        <Space>
          <a onClick={() => { setEditing(record); form.setFieldsValue(record); setModalVisible(true); }}>编辑</a>
          {!record.isSystem && (
            <Popconfirm title="确认删除?" onConfirm={async () => { await configApi.deleteSysConfig(record.id); message.success('已删除'); loadData(); }}>
              <a style={{ color: 'red' }}>删除</a>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <Card>
        <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }}
          onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增配置</Button>
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading} size="small" />
      </Card>
      <Modal title={editing ? '编辑配置' : '新增配置'} open={modalVisible} onOk={async () => {
        const values = await form.validateFields();
        await configApi.upsertSysConfig(values);
        message.success('操作成功'); setModalVisible(false); loadData();
      }} onCancel={() => setModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="configKey" label="参数键名" rules={[{ required: true }]}><Input disabled={!!editing} /></Form.Item>
          <Form.Item name="configName" label="参数名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="configValue" label="参数值" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigPage;
