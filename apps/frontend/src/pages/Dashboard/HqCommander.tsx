import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Tag, List, Empty, Spin } from 'antd';
import {
  DollarOutlined, TeamOutlined,
  CheckCircleOutlined, AlertOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Column, Pie } from '@ant-design/charts';
import { history } from '@umijs/max';
import { getHqCommanderStats } from '../../services/dashboard';

const HqCommanderDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHqCommanderStats().then((res: any) => {
      setData(res?.data || res || {});
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />;
  if (!data) return <Empty description="暂无数据" />;

  const { sponsorRanking = [], receivable = {}, sopMatrix = [], expertStats = {}, branchStats = [], recentAnnouncements = [] } = data;

  const sopStatusMap: Record<string, string> = { completed: '已完成', in_progress: '进行中', pending: '待开始', overdue: '已逾期', delayed: '已逾期' };
  const sopColorMap: Record<string, string> = { completed: '#52c41a', in_progress: '#1890ff', pending: '#faad14', overdue: '#f5222d', delayed: '#f5222d' };
  const sopData = sopMatrix.map((i: any) => ({ type: sopStatusMap[i.status] || i.status, value: Number(i.count || 0) }));
  const sopColors = sopMatrix.map((i: any) => sopColorMap[i.status] || '#999');

  const branchStatusMap: Record<number, string> = { 0: '待初审', 1: '初审通过', 2: '复审通过', 3: '已建档', 9: '已拒绝' };
  const branchColorMap: Record<number, string> = { 0: '#faad14', 1: '#1890ff', 2: '#13c2c2', 3: '#52c41a', 9: '#f5222d' };
  const branchData = branchStats.map((i: any) => ({ type: branchStatusMap[Number(i.status)] || `状态${i.status}`, value: Number(i.count || 0) }));
  const branchColors = branchStats.map((i: any) => branchColorMap[Number(i.status)] || '#999');

  const sponsorChartData = sponsorRanking.slice(0, 10).map((item: any, idx: number) => ({
    name: item.orgName || `分会${idx + 1}`, value: Number(item.totalAmount || 0),
  }));

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => history.push('/finance/revenue')} style={{ cursor: 'pointer' }}>
            <Statistic title="应收账款总额" value={Number(receivable.totalReceivable || 0)} precision={2} prefix={<DollarOutlined />} suffix="元" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => history.push('/finance/revenue')} style={{ cursor: 'pointer' }}>
            <Statistic title="已收款" value={Number(receivable.paidAmount || 0)} precision={2} prefix={<CheckCircleOutlined />} suffix="元" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => history.push('/finance/settlement')} style={{ cursor: 'pointer' }}>
            <Statistic title="待收款" value={Number(receivable.unpaidAmount || 0)} precision={2} prefix={<AlertOutlined />} suffix="元" valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => history.push('/branch-hr/experts')} style={{ cursor: 'pointer' }}>
            <Statistic title="智库活跃专家" value={Number(expertStats.activeExperts || 0)} prefix={<TeamOutlined />} suffix={`/ ${expertStats.totalAssignments || 0} 次派遣`} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="赛事SOP任务状态分布" size="small"
            extra={<a onClick={() => history.push('/event/sop-progress')}>查看详情 <RightOutlined /></a>}>
            {sopData.length > 0 ? (
              <Pie data={sopData} angleField="value" colorField="type" radius={0.8} innerRadius={0.5}
                label={{ type: 'spider', content: '{name}\n{value}' }}
                legend={{ position: 'bottom' }} height={280} color={sopColors} />
            ) : <Empty description="暂无SOP任务数据" />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="分会入驻审批状态" size="small"
            extra={<a onClick={() => history.push('/branch-hr/applications')}>查看详情 <RightOutlined /></a>}>
            {branchData.length > 0 ? (
              <Pie data={branchData} angleField="value" colorField="type" radius={0.8} innerRadius={0.5}
                label={{ type: 'spider', content: '{name}\n{value}' }}
                legend={{ position: 'bottom' }} height={280} color={branchColors} />
            ) : <Empty description="暂无分会入驻数据" />}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="全国招商总额排行榜 TOP10" size="small"
            extra={<a onClick={() => history.push('/sponsorship/contracts')}>查看合同 <RightOutlined /></a>}>
            {sponsorChartData.length > 0 ? (
              <Column data={sponsorChartData} xField="name" yField="value" height={300} color="#1890ff"
                label={{ position: 'top', formatter: (datum: any) => `¥${(datum.value / 10000).toFixed(1)}万` }}
                yAxis={{ label: { formatter: (v: string) => `${(Number(v) / 10000).toFixed(0)}万` } }}
                meta={{ value: { alias: '招商总额(元)' } }} />
            ) : <Empty description="暂无招商数据" />}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="最新公告" size="small"
            extra={<a onClick={() => history.push('/event/announcements')}>全部公告 <RightOutlined /></a>}>
            <List dataSource={recentAnnouncements}
              renderItem={(item: any) => (
                <List.Item style={{ cursor: 'pointer' }} onClick={() => history.push('/event/announcements')}>
                  <List.Item.Meta
                    title={<>{item.type === 'RED_HEADER' ? <Tag color="red">红头</Tag> : item.type === 'URGENT' ? <Tag color="orange">紧急</Tag> : <Tag>普通</Tag>} {item.title}</>}
                    description={item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : ''} />
                </List.Item>
              )}
              locale={{ emptyText: '暂无公告' }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HqCommanderDashboard;
