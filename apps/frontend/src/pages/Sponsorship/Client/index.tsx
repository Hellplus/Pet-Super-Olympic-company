import React, { useRef } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSwitch } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message } from 'antd';
import { PlusOutlined, StarOutlined } from '@ant-design/icons';

const ClientPage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const columns: ProColumns[] = [
    { title: '客户全称', dataIndex: 'clientName', ellipsis: true },
    { title: '联系人', dataIndex: 'contactName', width: 100 },
    { title: '联系电话', dataIndex: 'contactPhone', width: 130 },
    { title: '意向金额', dataIndex: 'intentAmount', width: 130,
      render: (v: any) => `￥${Number(v || 0).toLocaleString()}` },
    { title: '引荐总部', dataIndex: 'referToHq', width: 100,
      render: (v: any) => v ? <Tag icon={<StarOutlined />} color="gold">已引荐</Tag> : <Tag>未引荐</Tag> },
    { title: '录入时间', dataIndex: 'createdAt', width: 160, valueType: 'dateTime', search: false },
    {
      title: '操作', width: 100, search: false,
      render: () => <Button type="link" size="small">编辑</Button>,
    },
  ];

  return (
    <PageContainer>
      <ProTable
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        request={async () => ({ data: [], success: true, total: 0 })}
        toolBarRender={() => [
          <ModalForm
            key="add"
            title="新增客户"
            trigger={<Button type="primary" icon={<PlusOutlined />}>极简录入</Button>}
            onFinish={async (values) => {
              message.success('录入成功');
              actionRef.current?.reload();
              return true;
            }}
          >
            <ProFormText name="clientName" label="客户全称" rules={[{ required: true }]} />
            <ProFormText name="contactName" label="联系人" />
            <ProFormText name="contactPhone" label="联系电话" />
            <ProFormText name="intentAmount" label="意向金额" />
            <ProFormSwitch name="referToHq" label="引荐给总部" />
          </ModalForm>,
        ]}
      />
    </PageContainer>
  );
};

export default ClientPage;
