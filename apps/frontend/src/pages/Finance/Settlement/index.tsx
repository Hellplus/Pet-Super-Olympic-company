import React, { useRef } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Tag, Button, Space, message, Popconfirm } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const SettlementPage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const columns: ProColumns[] = [
    { title: '账单编号', dataIndex: 'billNo', width: 160 },
    { title: '分会', dataIndex: 'organizationId', ellipsis: true },
    { title: '结算周期', dataIndex: 'period', width: 120 },
    { title: '分会收入总额', dataIndex: 'branchAmount', width: 130,
      render: (v: any) => `￥${Number(v || 0).toLocaleString()}` },
    { title: '总部应收', dataIndex: 'hqAmount', width: 130,
      render: (v: any) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>￥{Number(v || 0).toLocaleString()}</span> },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (v: any) => Number(v) === 1
        ? <Tag icon={<CheckCircleOutlined />} color="success">已结算</Tag>
        : <Tag icon={<ClockCircleOutlined />} color="warning">待结算</Tag>
    },
    { title: '凭证', dataIndex: 'paymentVoucher', width: 80, search: false,
      render: (v: any) => v ? <Tag color="green">已上传</Tag> : <Tag color="red">缺失</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, valueType: 'dateTime', search: false },
    {
      title: '操作', width: 120, search: false,
      render: (_, record: any) => (
        <Space>
          {Number(record.status) === 0 && (
            <Button type="link" size="small"
              onClick={() => message.info('催缴功能开发中')}>
              一键催缴
            </Button>
          )}
        </Space>
      ),
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
      />
    </PageContainer>
  );
};

export default SettlementPage;
