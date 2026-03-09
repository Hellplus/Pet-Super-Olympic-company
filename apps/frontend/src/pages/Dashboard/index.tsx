import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, Typography, Divider, Timeline } from 'antd';
import { TeamOutlined, BankOutlined, AuditOutlined, TrophyOutlined, SafetyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';

const { Title, Paragraph } = Typography;

const Dashboard: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  return (
    <PageContainer>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable><Statistic title="分会总数" value={'-'} prefix={<BankOutlined style={{ color: '#1890ff' }} />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable><Statistic title="系统用户" value={'-'} prefix={<TeamOutlined style={{ color: '#52c41a' }} />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable><Statistic title="赛事总数" value={'-'} prefix={<TrophyOutlined style={{ color: '#faad14' }} />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable><Statistic title="审计记录" value={'-'} prefix={<AuditOutlined style={{ color: '#f5222d' }} />} /></Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="欢迎使用 IPOC 管控系统">
            <Title level={4}>
              {currentUser ? `你好，${currentUser.realName || currentUser.username}` : '你好'}
            </Title>
            <Paragraph>国际宠物奥林匹克超级赛组委会内部数字化管控系统 V1.0</Paragraph>
            <Divider />
            <Paragraph type="secondary">
              本系统覆盖组织架构管理、用户权限管理、财务内控、招商合规、赛事协同等核心业务场景，
              实现总部与各级分会的数字化管控与高效协同。
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="系统模块" size="small">
            <Timeline
              items={[
                { color: 'green', children: '权限中心 - 已上线', dot: <SafetyOutlined /> },
                { color: 'green', children: '组织架构管理 - 已上线', dot: <BankOutlined /> },
                { color: 'blue', children: '财务内控模块 - 规划中', dot: <ClockCircleOutlined /> },
                { color: 'blue', children: '招商合规模块 - 规划中', dot: <ClockCircleOutlined /> },
                { color: 'blue', children: '赛事协同模块 - 规划中', dot: <ClockCircleOutlined /> },
                { color: 'blue', children: 'BI驾驶舱 - 规划中', dot: <ClockCircleOutlined /> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Dashboard;
