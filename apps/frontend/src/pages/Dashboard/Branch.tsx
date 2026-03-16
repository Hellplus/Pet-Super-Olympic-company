import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Tag, Progress, Empty, Spin, List } from 'antd';
import {
  DollarOutlined, TrophyOutlined, FundOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { Column, Line } from '@ant-design/charts';
import { getBranchStats } from '../../services/dashboard';

const BranchDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBranchStats().then((res: any) => {
      setData(res?.data || res || {});
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;
  if (!data) return <Empty description="暂无数据" />;

  const { sponsorStats = {}, budgetStats = [], eventProgress = [], revenueStats = [] } = data;

  const totalRevenue = revenueStats.reduce((s: number, r: any) => s + Number(r.totalAmount || 0), 0);

  // 月度收入柱状图
  const revenueChartData = revenueStats.map((r: any) => ({
    month: r.month, value: Number(r.totalAmount || 0),
  }));

  // 预算消耗健康度数据
  const budgetChartData = budgetStats.map((b: any) => ({
    name: b.eventName || '未命名赛事',
    totalAmount: Number(b.totalAmount || 0),
    usedAmount: Number(b.usedAmount || 0),
    pct: Number(b.totalAmount) > 0 ? Math.round(Number(b.usedAmount) / Number(b.totalAmount) * 100) : 0,
  }));

  const eventStatusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    preparing: { color: 'processing', text: '筹备中' },
    ongoing: { color: 'success', text: '进行中' },
    completed: { color: 'default', text: '已完成' },
    cancelled: { color: 'error', text: '已取消' },
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card><Statistic title="赞助合同总数" value={Number(sponsorStats.contractCount || 0)} prefix={<FundOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="招商总额" value={Number(sponsorStats.totalAmount || 0)} precision={2} prefix={<DollarOutlined />} suffix="元" valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card><Statistic title="累计收入" value={totalRevenue} precision={2} prefix={<CheckCircleOutlined />} suffix="元" valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="预算消耗健康度" size="small">
            {budgetChartData.length > 0 ? (
              <Column data={budgetChartData} xField="name" yField="pct" height={280}
                color={(datum: any) => datum.pct > 90 ? '#f5222d' : datum.pct > 70 ? '#faad14' : '#52c41a'}
                label={{ position: 'top', formatter: (datum: any) => `${datum.pct}%` }}
                yAxis={{ label: { formatter: (v: string) => `${v}%` }, max: 100 }}
                meta={{ pct: { alias: '消耗比例(%)' } }}
                tooltip={{ formatter: (datum: any) => ({ name: datum.name, value: `已用 ${datum.pct}%（¥${datum.usedAmount.toLocaleString()} / ¥${datum.totalAmount.toLocaleString()}）` }) }} />
            ) : <Empty description="暂无预算数据" />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="月度收入趋势" size="small">
            {revenueChartData.length > 0 ? (
              <Line data={revenueChartData} xField="month" yField="value" height={280}
                color="#1890ff"
                point={{ size: 4, shape: 'circle' }}
                yAxis={{ label: { formatter: (v: string) => `${(Number(v) / 10000).toFixed(0)}万` } }}
                tooltip={{ formatter: (datum: any) => ({ name: '月收入', value: `¥${Number(datum.value).toLocaleString()}` }) }}
                smooth />
            ) : <Empty description="暂无收入数据" />}
          </Card>
        </Col>
      </Row>

      <Card title="赛事任务进度" size="small" style={{ marginTop: 16 }}>
        {eventProgress.length > 0 ? (
          <List dataSource={eventProgress}
            renderItem={(item: any) => {
              const s = eventStatusMap[item.status] || { color: 'default', text: item.status };
              return (
                <List.Item extra={<Progress percent={Number(item.progress || 0)} size="small" style={{ width: 150 }} />}>
                  <List.Item.Meta
                    avatar={<TrophyOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
                    title={<>{item.name} <Tag color={s.color}>{s.text}</Tag></>}
                    description={item.eventDate ? `赛事日期：${new Date(item.eventDate).toLocaleDateString('zh-CN')}` : '日期待定'} />
                </List.Item>
              );
            }} />
        ) : <Empty description="暂无赛事数据" />}
      </Card>
    </div>
  );
};

export default BranchDashboard;
