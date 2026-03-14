import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, Typography, Divider, Timeline, Tabs, Tag, Spin } from 'antd';
import {
  TeamOutlined, BankOutlined, AuditOutlined, TrophyOutlined,
  SafetyOutlined, ClockCircleOutlined, DollarOutlined,
  FundOutlined, AlertOutlined, RiseOutlined,
} from '@ant-design/icons';
import { useModel } from '@umijs/max';
import { getOverview } from '../../services/dashboard';
import HqCommanderDashboard from './HqCommander';
import HqFinanceDashboard from './HqFinance';
import BranchDashboard from './Branch';
import AnnouncementPopup from '../../components/AnnouncementPopup';

const { Title, Paragraph } = Typography;

const Dashboard: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [overview, setOverview] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverview().then((res: any) => {
      setOverview(res?.data || res || {});
    }).finally(() => setLoading(false));
  }, []);

  const isSuperAdmin = currentUser?.isSuperAdmin;

  return (
    <PageContainer>
      <AnnouncementPopup />
      <Spin spinning={loading}>
        {/* 全局概览卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic title="分会总数" value={overview.branchCount ?? '-'} prefix={<BankOutlined style={{ color: '#1890ff' }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic title="系统用户" value={overview.userCount ?? '-'} prefix={<TeamOutlined style={{ color: '#52c41a' }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic title="赛事总数" value={overview.eventCount ?? '-'} prefix={<TrophyOutlined style={{ color: '#faad14' }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic title="专家智库" value={overview.expertCount ?? '-'} prefix={<AuditOutlined style={{ color: '#f5222d' }} />} />
            </Card>
          </Col>
        </Row>

        {/* 角色化 BI 大屏 */}
        <Card style={{ marginTop: 16 }}>
          {isSuperAdmin ? (
            <Tabs
              defaultActiveKey="commander"
              items={[
                {
                  key: 'commander',
                  label: <span><FundOutlined /> 总指挥大屏</span>,
                  children: <HqCommanderDashboard />,
                },
                {
                  key: 'finance',
                  label: <span><DollarOutlined /> 财务总监大屏</span>,
                  children: <HqFinanceDashboard />,
                },
                {
                  key: 'branch',
                  label: <span><BankOutlined /> 分会视角</span>,
                  children: <BranchDashboard />,
                },
              ]}
            />
          ) : (
            <BranchDashboard />
          )}
        </Card>

        {/* 底部信息 */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} lg={16}>
            <Card title="欢迎使用 IPOC 管控系统">
              <Title level={4}>
                {currentUser ? `你好，${currentUser.realName || currentUser.username}` : '你好'}
              </Title>
              <Paragraph>国际宠物奥林匹克超级赛组委会内部数字化管控系统 V1.0</Paragraph>
              <Divider />
              <Paragraph type="secondary">
                本系统覆盖组织架构管理、用户权限管理、财务内控、招商合规、赛事协同等核心业务场景。
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="系统模块" size="small">
              <Timeline
                items={[
                  { color: 'green', children: '权限中心 - 已上线', dot: <SafetyOutlined /> },
                  { color: 'green', children: '组织架构管理 - 已上线', dot: <BankOutlined /> },
                  { color: 'green', children: '财务内控模块 - 已上线', dot: <DollarOutlined /> },
                  { color: 'green', children: '招商合规模块 - 已上线', dot: <RiseOutlined /> },
                  { color: 'green', children: '赛事协同模块 - 已上线', dot: <TrophyOutlined /> },
                  { color: 'green', children: 'BI驾驶舱 - 已上线', dot: <FundOutlined /> },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </PageContainer>
  );
};

export default Dashboard;
