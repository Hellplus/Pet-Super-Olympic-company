import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Button, Tag, Space, message, Popconfirm, Progress } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import * as api from '@/services/finance';

const BudgetPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); const res = await api.getBudgets(); setData(res.data || []); setLoading(false); };
  useEffect(() => { load(); }, []);

  const statusMap: Record<number, { text: string; color: string }> = {
    0: { text: '待审批', color: 'orange' }, 1: { text: '已锁定', color: 'green' }, 2: { text: '已驳回', color: 'red' }, 3: { text: '已结案', color: 'default' },
  };

  const columns = [
    { title: '赛事名称', dataIndex: 'eventName', width: 200 },
    { title: '分会', dataIndex: ['organization', 'name'], width: 150 },
    { title: '预算总额', dataIndex: 'totalBudget', width: 120, render: (v: number) => '¥' + Number(v).toLocaleString() },
    { title: '已使用', dataIndex: 'usedAmount', width: 120, render: (v: number) => '¥' + Number(v).toLocaleString() },
    { title: '消耗率', width: 150, render: (_: any, r: any) => {
      const pct = r.totalBudget > 0 ? Math.round(Number(r.usedAmount) / Number(r.totalBudget) * 100) : 0;
      return <Progress percent={pct} size="small" status={pct > 90 ? 'exception' : 'normal'} />;
    }},
    { title: '状态', dataIndex: 'status', width: 100, render: (v: number) => { const s = statusMap[v]; return <Tag color={s?.color}>{s?.text}</Tag>; }},
    { title: '操作', width: 150, render: (_: any, r: any) => r.status === 0 ? (
      <Space>
        <Popconfirm title="确认通过?" onConfirm={async () => { await api.approveBudget(r.id, true); message.success('已通过'); load(); }}>
          <Button size="small" type="primary" icon={<CheckOutlined />}>通过</Button>
        </Popconfirm>
        <Popconfirm title="确认驳回?" onConfirm={async () => { await api.approveBudget(r.id, false); message.success('已驳回'); load(); }}>
          <Button size="small" danger icon={<CloseOutlined />}>驳回</Button>
        </Popconfirm>
      </Space>
    ) : null },
  ];

  return (
    <PageContainer>
      <Card><Table rowKey="id" columns={columns} dataSource={data} loading={loading} size="small" /></Card>
    </PageContainer>
  );
};
export default BudgetPage;
