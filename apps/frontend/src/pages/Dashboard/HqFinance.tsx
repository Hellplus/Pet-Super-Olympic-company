import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Progress, Empty, Spin, Alert, Typography } from 'antd';
import {
  DollarOutlined, WarningOutlined, CheckCircleOutlined,
  AlertOutlined, FundOutlined,
} from '@ant-design/icons';
import { getHqFinanceStats } from '../../services/dashboard';

const { Text } = Typography;

const HqFinanceDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHqFinanceStats().then((res: any) => {
      setData(res?.data || res || {});
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;
  if (!data) return <Empty description="暂无数据" />;

  const { monthlyRevenue = [], overBudgetStats = [], unreconciledExpenses = [], budgetHealth = [] } = data;

  // 汇总统计
  const totalRevenue = monthlyRevenue.reduce((s: number, m: any) => s + Number(m.totalAmount || 0), 0);
  const totalCommission = monthlyRevenue.reduce((s: number, m: any) => s + Number(m.hqCommission || 0), 0);
  const totalBudget = budgetHealth.reduce((s: number, b: any) => s + Number(b.totalBudget || 0), 0);
  const totalUsed = budgetHealth.reduce((s: number, b: any) => s + Number(b.usedBudget || 0), 0);

  const revenueColumns = [
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '收入总额', dataIndex: 'totalAmount', key: 'totalAmount',
      render: (v: any) => `￥${Number(v || 0).toLocaleString()}` },
    { title: '总部抽佣', dataIndex: 'hqCommission', key: 'hqCommission',
      render: (v: any) => <Text type="success">￥{Number(v || 0).toLocaleString()}</Text> },
  ];

  const overBudgetColumns = [
    { title: '分会ID', dataIndex: 'orgId', key: 'orgId', ellipsis: true },
    { title: '报销总数', dataIndex: 'totalExpenses', key: 'totalExpenses' },
    { title: '超预算次数', dataIndex: 'overBudgetCount', key: 'overBudgetCount',
      render: (v: any) => Number(v) > 0 ? <Tag color="red">{v}</Tag> : <Tag color="green">{v}</Tag> },
    { title: '超预算率', key: 'rate',
      render: (_: any, r: any) => {
        const rate = Number(r.totalExpenses) > 0 ? (Number(r.overBudgetCount) / Number(r.totalExpenses) * 100) : 0;
        return <Progress percent={Math.round(rate)} size="small" status={rate > 30 ? 'exception' : 'normal'} />;
      }},
  ];

  const unreconciledColumns = [
    { title: '单据ID', dataIndex: 'id', key: 'id', ellipsis: true, width: 120 },
    { title: '摘要', dataIndex: 'subject', key: 'subject', ellipsis: true },
    { title: '金额', dataIndex: 'amount', key: 'amount',
      render: (v: any) => <Text type="danger">￥{Number(v || 0).toLocaleString()}</Text> },
    { title: '提交日期', dataIndex: 'createdAt', key: 'createdAt',
      render: (v: any) => v ? new Date(v).toLocaleDateString('zh-CN') : '-' },
  ];

  return (
    <div>
      {/* 核心指标 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="全网收入总额" value={totalRevenue} precision={2} prefix={<DollarOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="总部抽佣总额" value={totalCommission} precision={2}
              prefix={<FundOutlined />} suffix="元" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="全网预算总额" value={totalBudget} precision={2} prefix={<CheckCircleOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="已使用预算" value={totalUsed} precision={2}
              prefix={<AlertOutlined />} suffix="元"
              valueStyle={{ color: totalBudget > 0 && totalUsed / totalBudget > 0.8 ? '#cf1322' : '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      {/* 糊涂账预警 */}
      {unreconciledExpenses.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`糊涂账预警：共 ${unreconciledExpenses.length} 笔已审批单据未上传打款凭证`}
          style={{ marginTop: 16 }}
        />
      )}

      {/* 第二行 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="全网资金流水曲线（按月）" size="small">
            <Table
              dataSource={monthlyRevenue}
              columns={revenueColumns}
              rowKey="month"
              size="small"
              pagination={false}
              scroll={{ y: 250 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="各地超预算频率" size="small">
            <Table
              dataSource={overBudgetStats}
              columns={overBudgetColumns}
              rowKey="orgId"
              size="small"
              pagination={false}
              scroll={{ y: 250 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 糊涂账列表 */}
      <Card title="未核销糊涂账单据" size="small" style={{ marginTop: 16 }}>
        <Table
          dataSource={unreconciledExpenses}
          columns={unreconciledColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default HqFinanceDashboard;
