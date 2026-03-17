import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Row, Col, Table, Progress, Tag, Spin, Typography, Statistic } from 'antd';
import { TrophyOutlined, DollarOutlined, CheckCircleOutlined, TeamOutlined, FundOutlined } from '@ant-design/icons';
import { getBranchComparison } from '@/services/dashboard';

const { Text, Title } = Typography;

const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32']; // 金银铜

const RankingCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  data: any[];
  valueKey: string;
  valueLabel: string;
  format?: (v: any) => string;
  progressMax?: number;
  progressColor?: (v: number) => string;
}> = ({ title, icon, data, valueKey, valueLabel, format, progressMax, progressColor }) => {
  const maxVal = progressMax || Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);

  const columns = [
    {
      title: '排名', width: 60, render: (_: any, __: any, index: number) => {
        if (index < 3) return <TrophyOutlined style={{ color: medalColors[index], fontSize: 18 }} />;
        return <Text type="secondary">{index + 1}</Text>;
      },
    },
    { title: '分部', dataIndex: 'orgName', width: 150, ellipsis: true,
      render: (v: string, _: any, index: number) => index < 3 ? <Text strong>{v || '未知'}</Text> : (v || '未知'),
    },
    {
      title: valueLabel, dataIndex: valueKey, width: 200,
      render: (v: any) => {
        const num = Number(v) || 0;
        const pct = Math.min((num / maxVal) * 100, 100);
        const color = progressColor ? progressColor(num) : undefined;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress
              percent={pct}
              showInfo={false}
              size="small"
              strokeColor={color}
              style={{ flex: 1, minWidth: 80 }}
            />
            <Text strong style={{ minWidth: 80, textAlign: 'right' }}>
              {format ? format(v) : num.toLocaleString()}
            </Text>
          </div>
        );
      },
    },
  ];

  return (
    <Card
      title={<span>{icon} {title}</span>}
      size="small"
      style={{ marginBottom: 16 }}
      extra={<Tag>{data.length} 个分部</Tag>}
    >
      <Table
        rowKey="orgId"
        columns={columns}
        dataSource={data}
        size="small"
        pagination={false}
        scroll={{ y: 300 }}
      />
    </Card>
  );
};

const BranchComparisonPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBranchComparison()
      .then((res: any) => setData(res?.data || res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sponsorRanking = data?.sponsorRanking || [];
  const eventCompletion = data?.eventCompletion || [];
  const budgetUsage = data?.budgetUsage || [];
  const expertRanking = data?.expertRanking || [];
  const revenueRanking = data?.revenueRanking || [];

  // 汇总统计
  const totalSponsor = sponsorRanking.reduce((s: number, r: any) => s + Number(r.totalAmount || 0), 0);
  const totalRevenue = revenueRanking.reduce((s: number, r: any) => s + Number(r.totalRevenue || 0), 0);
  const totalExperts = expertRanking.reduce((s: number, r: any) => s + Number(r.expertCount || 0), 0);

  return (
    <PageContainer title="跨分部数据对比报表" subTitle="全维度分部排名与对比分析">
      <Spin spinning={loading}>
        {/* 汇总指标 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic title="全网赞助总签约额" value={totalSponsor} prefix="¥" precision={0}
                valueStyle={{ color: '#cf1322' }} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="全网收入总额" value={totalRevenue} prefix="¥" precision={0}
                valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="全网专家总数" value={totalExperts} prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
        </Row>

        {/* 排行榜 */}
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <RankingCard
              title="赞助签约额排行"
              icon={<DollarOutlined style={{ color: '#cf1322' }} />}
              data={sponsorRanking}
              valueKey="totalAmount"
              valueLabel="签约总额"
              format={(v: any) => `¥${Number(v || 0).toLocaleString()}`}
            />
          </Col>
          <Col xs={24} lg={12}>
            <RankingCard
              title="收入排行"
              icon={<FundOutlined style={{ color: '#3f8600' }} />}
              data={revenueRanking}
              valueKey="totalRevenue"
              valueLabel="收入总额"
              format={(v: any) => `¥${Number(v || 0).toLocaleString()}`}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <RankingCard
              title="赛事SOP完成率排行"
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              data={eventCompletion}
              valueKey="completionRate"
              valueLabel="完成率"
              format={(v: any) => `${Number(v || 0)}%`}
              progressMax={100}
              progressColor={(v: number) => v >= 80 ? '#52c41a' : v >= 50 ? '#faad14' : '#f5222d'}
            />
          </Col>
          <Col xs={24} lg={12}>
            <RankingCard
              title="预算使用率排行"
              icon={<DollarOutlined style={{ color: '#faad14' }} />}
              data={budgetUsage}
              valueKey="usageRate"
              valueLabel="使用率"
              format={(v: any) => `${Number(v || 0)}%`}
              progressMax={100}
              progressColor={(v: number) => v > 100 ? '#f5222d' : v > 80 ? '#faad14' : '#52c41a'}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <RankingCard
              title="专家资源排行"
              icon={<TeamOutlined style={{ color: '#1890ff' }} />}
              data={expertRanking}
              valueKey="expertCount"
              valueLabel="专家数量"
            />
          </Col>
        </Row>
      </Spin>
    </PageContainer>
  );
};

export default BranchComparisonPage;
