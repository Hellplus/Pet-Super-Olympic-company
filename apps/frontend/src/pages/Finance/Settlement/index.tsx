import React, { useRef, useState } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, message, Tag, Space, Card, Row, Col, Statistic, Modal, DatePicker } from 'antd';
import { MoneyCollectOutlined, BellOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { request } from '@umijs/max';

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待确认', color: 'processing' },
  1: { text: '已确认', color: 'green' },
  2: { text: '已催缴', color: 'orange' },
  3: { text: '已缴纳', color: 'cyan' },
};

const SettlementPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [batchVisible, setBatchVisible] = useState(false);
  const [period, setPeriod] = useState('');

  const columns: ProColumns[] = [
    { title: '账单编号', dataIndex: 'billNo', width: 150 },
    { title: '分会', dataIndex: ['organization', 'name'], width: 150 },
    { title: '账期', dataIndex: 'period', width: 100 },
    { title: '总收款', dataIndex: 'totalRevenue', width: 120, valueType: 'money' },
    { title: '抽成比例', dataIndex: 'commissionRate', width: 80, render: (v: any) => `${v}%` },
    { title: '应上缴', dataIndex: 'commissionAmount', width: 120, valueType: 'money',
      render: (v: any, r: any) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{Number(r.commissionAmount).toLocaleString()}</span> },
    { title: '状态', dataIndex: 'status', width: 90,
      render: (_: any, r: any) => { const s = statusMap[r.status]; return <Tag color={s?.color}>{s?.text}</Tag>; }
    },
    {
      title: '操作', width: 120,
      render: (_: any, r: any) => (
        <Space>
          {(r.status === 0 || r.status === 1) && (
            <Button size="small" type="primary" icon={<BellOutlined />}
              onClick={async () => {
                await request(`/api/v1/finance/settlements/${r.id}/remind`, { method: 'POST' });
                message.success('已发送催缴通知');
                actionRef.current?.reload();
              }}>催缴</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable headerTitle="清算账单" actionRef={actionRef} rowKey="id" columns={columns}
        search={false}
        request={async () => {
          const res = await request('/api/v1/finance/settlements');
          return { data: res?.data || res || [], success: true };
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<ThunderboltOutlined />}
            onClick={() => setBatchVisible(true)}>
            一键生成全部清算
          </Button>,
        ]}
      />
      <Modal title="批量生成清算账单" open={batchVisible}
        onCancel={() => setBatchVisible(false)}
        onOk={async () => {
          if (!period) { message.warning('请选择账期'); return; }
          const res = await request('/api/v1/finance/settlements/batch-generate', {
            method: 'POST', data: { period },
          });
          const d = res?.data || res;
          message.success(`已生成 ${d?.generatedCount || 0} 张清算账单`);
          setBatchVisible(false);
          actionRef.current?.reload();
        }}>
        <DatePicker.MonthPicker
          onChange={(_, ds) => setPeriod(ds as string)}
          placeholder="选择清算月份"
          style={{ width: '100%' }}
        />
      </Modal>
    </PageContainer>
  );
};
export default SettlementPage;
