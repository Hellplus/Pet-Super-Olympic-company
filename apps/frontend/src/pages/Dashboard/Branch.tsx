import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Progress, Empty, Spin, List } from 'antd';
import {
  DollarOutlined, TrophyOutlined, FundOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { Typography } from 'antd';
import { getBranchStats } from '../../services/dashboard';

const { Text } = Typography;

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

  const budgetColumns = [
    { title: '赛事名称', dataIndex: 'eventName', key: 'eventName', ellipsis: true },
    { title: '总预算', dataIndex: 'totalAmount', key: 'totalAmount',
      render: (v: any) => `￥${Number(v || 0).toLocaleString()}` },
    { title: '已使用', dataIndex: 'usedAmount', key: 'usedAmount',
      render: (v: any) => `￥${Number(v || 0).toLocaleString()}` },
    { title: '消耗健康度', key: 'health',
      render: (_: any, r: any) => {
        const total = Number(r.totalAmount || 1);
        const used = Number(r.usedAmount || 0);
        const pct = Math.round((used / total) * 100);
        return <Progress percent={pct} size="small"
          status={pct > 90 ? 'exception' : pct > 70 ? 'active' : 'normal'}
          strokeColor={pct > 90 ? '#f5222d' : pct > 70 ? '#faad14' : '#52c41a'} />;
      }},
  ];

  const eventColumns = [
    { title: '赛事名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '赛事日期', dataIndex: 'eventDate', key: 'eventDate',
      render: (v: any) => v ? new Date(v).toLocaleDateString('zh-CN') : '-' },
    { title: '状态', dataIndex: 'status', key: 'status',
      render: (v: any) => {
        const map: Record<string, { color: string; text: string }> = {
          draft: { color: 'default', text: '草稿' },
          preparing: { color: 'processing', text: '筹备中' },
          ongoing: { color: 'success', text: '进行中' },
          completed: { color: 'default', text: '已完成' },
          cancelled: { color: 'error', text: '已取消' },
        };
        const s = map[v] || { color: 'default', text: v };
        return <Tag color={s.color}>{s.text}</Tag>;
      }},
    { title: 'SOP进度', dataIndex: 'progress', key: 'progress',
      render: (v: any) => <Progress percent={Number(v || 0)} size="small" /> },
  ];

  const revenueColumns = [
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '收入', dataIndex: 'totalAmount', key: 'totalAmount',
      render: (v: any) => <Text strong>￥{Number(v || 0).toLocaleString()}</Text> },
  ];

  return (
    <div>
      {/* 核心指标 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="赞助合同总数" value={Number(sponsorStats.contractCount || 0)}
              prefix={<FundOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="招商总额" value={Number(sponsorStats.totalAmount || 0)}
              precision={2} prefix={<DollarOutlined />} suffix="元"
              valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="累计收入" value={totalRevenue}
              precision={2} prefix={<CheckCircleOutlined />} suffix="元"
              valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      {/* 第二行 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="预算消耗健康度" size="small">
            <Table dataSource={budgetStats} columns={budgetColumns}
              rowKey="eventName" size="small" pagination={false} scroll={{ y: 250 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="赛事任务进度" size="small">
            <Table dataSource={eventProgress} columns={eventColumns}
              rowKey="id" size="small" pagination={false} scroll={{ y: 250 }} />
          </Card>
        </Col>
      </Row>

      {/* 第三行 */}
      <Card title="月度收入趋势" size="small" style={{ marginTop: 16 }}>
        <Table dataSource={revenueStats} columns={revenueColumns}
          rowKey="month" size="small" pagination={false} />
      </Card>
    </div>
  );
};

export default BranchDashboard;
