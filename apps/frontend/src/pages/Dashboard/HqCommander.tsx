import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Badge, List, Typography, Progress, Empty, Spin } from 'antd';
import {
  DollarOutlined, TrophyOutlined, TeamOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  RiseOutlined, AlertOutlined,
} from '@ant-design/icons';
import { getHqCommanderStats } from '../../services/dashboard';

const { Text } = Typography;

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

  // SOP 统计
  const sopTotal = sopMatrix.reduce((s: number, i: any) => s + Number(i.count || 0), 0);
  const getSopCount = (status: string) => Number(sopMatrix.find((i: any) => i.status === status)?.count || 0);
  const completedTasks = getSopCount('completed');
  const inProgressTasks = getSopCount('in_progress');
  const overdueTasks = getSopCount('overdue');
  const pendingTasks = getSopCount('pending');

  // 分会状态
  const getBranchCount = (status: number) => Number(branchStats.find((i: any) => Number(i.status) === status)?.count || 0);

  const sponsorColumns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 60, render: (_: any, __: any, idx: number) => {
      const colors = ['#f5222d', '#fa8c16', '#faad14'];
      return idx < 3 ? <Tag color={colors[idx]}>{idx + 1}</Tag> : idx + 1;
    }},
    { title: '分会ID', dataIndex: 'orgId', key: 'orgId', ellipsis: true },
    { title: '招商总额', dataIndex: 'totalAmount', key: 'totalAmount',
      render: (v: any) => <Text strong style={{ color: '#f5222d' }}>￥{Number(v || 0).toLocaleString()}</Text> },
    { title: '合同数', dataIndex: 'contractCount', key: 'contractCount' },
  ];

  return (
    <div>
      {/* 第一行：核心指标 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="应收账款总额"
              value={Number(receivable.totalReceivable || 0)}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已收款"
              value={Number(receivable.paidAmount || 0)}
              precision={2}
              prefix={<CheckCircleOutlined />}
              suffix="元"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待收款"
              value={Number(receivable.unpaidAmount || 0)}
              precision={2}
              prefix={<AlertOutlined />}
              suffix="元"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="智库活跃专家"
              value={Number(expertStats.activeExperts || 0)}
              prefix={<TeamOutlined />}
              suffix={`/ ${expertStats.totalAssignments || 0} 次派遣`}
            />
          </Card>
        </Col>
      </Row>

      {/* 第二行：SOP 矩阵 + 分会状态 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="全国赛事 SOP 红黄绿灯矩阵" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title={<><Badge status="success" /> 已完成</>} value={completedTasks} valueStyle={{ color: '#52c41a' }} />
              </Col>
              <Col span={6}>
                <Statistic title={<><Badge status="processing" /> 进行中</>} value={inProgressTasks} valueStyle={{ color: '#1890ff' }} />
              </Col>
              <Col span={6}>
                <Statistic title={<><Badge status="warning" /> 待开始</>} value={pendingTasks} valueStyle={{ color: '#faad14' }} />
              </Col>
              <Col span={6}>
                <Statistic title={<><Badge status="error" /> 已逾期</>} value={overdueTasks} valueStyle={{ color: '#f5222d' }} />
              </Col>
            </Row>
            {sopTotal > 0 && (
              <Progress
                percent={Math.round((completedTasks / sopTotal) * 100)}
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="分会入驻统计" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="待初审" value={getBranchCount(0)} valueStyle={{ color: '#faad14' }} />
              </Col>
              <Col span={6}>
                <Statistic title="审批中" value={getBranchCount(1) + getBranchCount(2)} valueStyle={{ color: '#1890ff' }} />
              </Col>
              <Col span={6}>
                <Statistic title="已建档" value={getBranchCount(3)} valueStyle={{ color: '#52c41a' }} />
              </Col>
              <Col span={6}>
                <Statistic title="已拒绝" value={getBranchCount(9)} valueStyle={{ color: '#f5222d' }} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 第三行：招商排行榜 + 最新公告 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="全国招商总额排行榜" size="small">
            <Table
              dataSource={sponsorRanking}
              columns={sponsorColumns}
              rowKey="orgId"
              size="small"
              pagination={false}
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="最新公告" size="small">
            <List
              dataSource={recentAnnouncements}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={<>{item.type === 'RED_HEADER' ? <Tag color="red">红头</Tag> : item.type === 'URGENT' ? <Tag color="orange">紧急</Tag> : <Tag>普通</Tag>} {item.title}</>}
                    description={item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : ''}
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无公告' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HqCommanderDashboard;
