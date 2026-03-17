import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Tag, Empty, Spin, Alert, List, Typography } from 'antd';
import {
  DollarOutlined, WarningOutlined, CheckCircleOutlined,
  AlertOutlined, FundOutlined, RightOutlined,
} from '@ant-design/icons';
import { Column, Line } from '@ant-design/charts';
import { history } from '@umijs/max';
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

  const totalRevenue = monthlyRevenue.reduce((s: number, m: any) => s + Number(m.totalAmount || 0), 0);
  const totalCommission = monthlyRevenue.reduce((s: number, m: any) => s + Number(m.hqCommission || 0), 0);
  const totalBudget = budgetHealth.reduce((s: number, b: any) => s + Number(b.totalBudget || 0), 0);
  const totalUsed = budgetHealth.reduce((s: number, b: any) => s + Number(b.usedBudget || 0), 0);

  // 月度资金流水双线图数据
  const revenueLineData = monthlyRevenue.flatMap((m: any) => [
    { month: m.month, value: Number(m.totalAmount || 0), type: '收入总额' },
    { month: m.month, value: Number(m.hqCommission || 0), type: '总部抽佣' },
  ]);

  // 超预算频率柱状图数据
  const overBudgetData = overBudgetStats.slice(0, 10).map((item: any, idx: number) => ({
    name: item.orgName || `分会${idx + 1}`,
    overBudgetCount: Number(item.overBudgetCount || 0),
    totalExpenses: Number(item.totalExpenses || 0),
    rate: Number(item.totalExpenses) > 0
      ? Math.round(Number(item.overBudgetCount) / Number(item.totalExpenses) * 100)
      : 0,
  }));

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => history.push('/finance/revenue')} style={{ cursor: 'pointer' }}>
            <Statistic title="全网收入总额" value={totalRevenue} precision={2} prefix={<DollarOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => history.push('/finance/revenue')} style={{ cursor: 'pointer' }}>
            <Statistic title="总部抽佣总额" value={totalCommission} precision={2} prefix={<FundOutlined />} suffix="元" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => history.push('/finance/budget')} style={{ cursor: 'pointer' }}>
            <Statistic title="全网预算总额" value={totalBudget} precision={2} prefix={<CheckCircleOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => history.push('/finance/budget')} style={{ cursor: 'pointer' }}>
            <Statistic title="已使用预算" value={totalUsed} precision={2} prefix={<AlertOutlined />} suffix="元"
              valueStyle={{ color: totalBudget > 0 && totalUsed / totalBudget > 0.8 ? '#cf1322' : '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      {unreconciledExpenses.length > 0 && (
        <Alert type="warning" showIcon icon={<WarningOutlined />}
          message={<a onClick={() => history.push('/finance/expense')} style={{ color: 'inherit' }}>
            糊涂账预警：共 {unreconciledExpenses.length} 笔已审批单据未上传打款凭证，点击查看
          </a>}
          style={{ marginTop: 16, cursor: 'pointer' }} />
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="全网资金流水曲线（按月）" size="small"
            extra={<a onClick={() => history.push('/finance/revenue')}>查看详情 <RightOutlined /></a>}>
            {revenueLineData.length > 0 ? (
              <Line data={revenueLineData} xField="month" yField="value" seriesField="type" height={280}
                color={['#1890ff', '#52c41a']}
                yAxis={{ label: { formatter: (v: string) => `${(Number(v) / 10000).toFixed(0)}万` } }}
                tooltip={{ formatter: (datum: any) => ({ name: datum.type, value: `¥${Number(datum.value).toLocaleString()}` }) }}
                legend={{ position: 'top' }}
                smooth />
            ) : <Empty description="暂无月度流水数据" />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="各地超预算频率" size="small"
            extra={<a onClick={() => history.push('/finance/expense')}>查看详情 <RightOutlined /></a>}>
            {overBudgetData.length > 0 ? (
              <Column data={overBudgetData} xField="name" yField="rate" height={280}
                color={(datum: any) => datum.rate > 30 ? '#f5222d' : datum.rate > 15 ? '#faad14' : '#52c41a'}
                label={{ position: 'top', formatter: (datum: any) => `${datum.rate}%` }}
                yAxis={{ label: { formatter: (v: string) => `${v}%` }, max: 100 }}
                meta={{ rate: { alias: '超预算率(%)' } }}
                tooltip={{ formatter: (datum: any) => ({ name: datum.name, value: `超预算率 ${datum.rate}%（${datum.overBudgetCount}/${datum.totalExpenses}）` }) }} />
            ) : <Empty description="暂无超预算数据" />}
          </Card>
        </Col>
      </Row>

      <Card title="未核销糊涂账单据" size="small" style={{ marginTop: 16 }}
        extra={<a onClick={() => history.push('/finance/expense')}>查看全部 <RightOutlined /></a>}>
        {unreconciledExpenses.length > 0 ? (
          <List dataSource={unreconciledExpenses}
            renderItem={(item: any) => (
              <List.Item style={{ cursor: 'pointer' }} onClick={() => history.push('/finance/expense')}>
                <List.Item.Meta
                  title={<>{item.subject || '未命名单据'} <Tag color="orange">￥{Number(item.amount || 0).toLocaleString()}</Tag></>}
                  description={item.createdAt ? `提交日期：${new Date(item.createdAt).toLocaleDateString('zh-CN')}` : ''} />
              </List.Item>
            )} />
        ) : <Empty description="暂无未核销单据" />}
      </Card>
    </div>
  );
};

export default HqFinanceDashboard;
