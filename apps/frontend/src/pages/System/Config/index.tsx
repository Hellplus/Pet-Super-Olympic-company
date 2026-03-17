import React, { useRef, useState } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Modal, Form, Input, message, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import * as configApi from '@/services/sysConfig';

const ConfigPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const columns: ProColumns[] = [
    { title: '参数键名', dataIndex: 'configKey', width: 200, copyable: true },
    { title: '参数名称', dataIndex: 'configName', width: 200 },
    { title: '参数值', dataIndex: 'configValue', ellipsis: true, hideInSearch: true },
    { title: '系统内置', dataIndex: 'isSystem', width: 80, hideInSearch: true,
      render: (v: any) => v ? <Tag color="blue">是</Tag> : '否' },
    { title: '备注', dataIndex: 'remark', ellipsis: true, hideInSearch: true },
    {
      title: '操作', width: 150, valueType: 'option',
      render: (_: any, record: any) => (
        <Space>
          <a onClick={() => { setEditing(record); form.setFieldsValue(record); setModalVisible(true); }}>编辑</a>
          {!record.isSystem && (
            <Popconfirm title="确认删除?" onConfirm={async () => {
              await configApi.deleteSysConfig(record.id);
              message.success('已删除');
              actionRef.current?.reload();
            }}>
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
        headerTitle="系统配置"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{ labelWidth: 'auto' }}
        request={async (params) => {
          const res = await configApi.getSysConfigs(params);
          const list = res.data?.items || res.data || [];
          return {
            data: Array.isArray(list) ? list : [],
            total: res.data?.total || (Array.isArray(list) ? list.length : 0),
            success: true,
          };
        }}
        toolBarRender={() => [
          <Button key="create" type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditing(null); form.resetFields(); setModalVisible(true); }}>新增配置</Button>,
        ]}
      />
      <Modal title={editing ? '编辑配置' : '新增配置'} open={modalVisible} onOk={async () => {
        const values = await form.validateFields();
        if (editing) values.id = editing.id;
        await configApi.upsertSysConfig(values);
        message.success('操作成功');
        setModalVisible(false);
        actionRef.current?.reload();
      }} onCancel={() => setModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="configKey" label="参数键名" rules={[{ required: true, message: '请输入参数键名' }]}>
            <Input disabled={!!editing} placeholder="如：site.name" />
          </Form.Item>
          <Form.Item name="configName" label="参数名称" rules={[{ required: true, message: '请输入参数名称' }]}>
            <Input placeholder="如：站点名称" />
          </Form.Item>
          <Form.Item name="configValue" label="参数值" rules={[{ required: true, message: '请输入参数值' }]}>
            <Input.TextArea rows={3} placeholder="配置值" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="选填，配置说明" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ConfigPage;
