import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Badge, Row, Col, Statistic, Spin, Empty, Tabs } from 'antd';
import {
  ClockCircleOutlined, DollarOutlined, AuditOutlined, TeamOutlined,
  WarningOutlined, FileProtectOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { request, history } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';

const typeConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  expense: { color: 'orange', label: '报销审批', icon: <DollarOutlined /> },
  budget: { color: 'blue', label: '预算审批', icon: <AuditOutlined /> },
  application: { color: 'purple', label: '入驻审批', icon: <TeamOutlined /> },
  task_overdue: { color: 'red', label: '任务逾期', icon: <ExclamationCircleOutlined /> },
  settlement: { color: 'volcano', label: '清算待缴', icon: <DollarOutlined /> },
  cert_warning: { color: 'gold', label: '证书预警', icon: <FileProtectOutlined /> },
};

const TodoCenter: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const res = await request('/dashboard/my-todos');
      setData(res?.data || res);
    } catch {}
    setLoading(false);
  };

  const summary = data?.summary || {};
  const allTodos = data?.todos || [];
  const filteredTodos = activeTab === 'all' ? allTodos : allTodos.filter((t: any) => t.type === activeTab);

  const statCards = [
    { title: '待审批报销', value: summary.pendingExpenses || 0, color: '#fa8c16', icon: <DollarOutlined /> },
    { title: '待审批预算', value: summary.pendingBudgets || 0, color: '#1890ff', icon: <AuditOutlined /> },
    { title: '入驻待审', value: summary.pendingApplications || 0, color: '#722ed1', icon: <TeamOutlined /> },
    { title: '逾期任务', value: summary.overdueTasks || 0, color: '#f5222d', icon: <ExclamationCircleOutlined /> },
    { title: '待缴清算', value: summary.unpaidSettlements || 0, color: '#fa541c', icon: <DollarOutlined /> },
    { title: '证书预警', value: summary.certWarnings || 0, color: '#faad14', icon: <WarningOutlined /> },
  ];

  const tabItems = [
    { key: 'all', label: <Badge count={allTodos.length} offset={[10, 0]} size="small">全部待办</Badge> },
    { key: 'expense', label: <Badge count={summary.pendingExpenses || 0} offset={[10, 0]} size="small">报销审批</Badge> },
    { key: 'budget', label: <Badge count={summary.pendingBudgets || 0} offset={[10, 0]} size="small">预算审批</Badge> },
    { key: 'task_overdue', label: <Badge count={summary.overdueTasks || 0} offset={[10, 0]} size="small">逾期任务</Badge> },
    { key: 'settlement', label: <Badge count={summary.unpaidSettlements || 0} offset={[10, 0]} size="small">清算待缴</Badge> },
    { key: 'cert_warning', label: <Badge count={summary.certWarnings || 0} offset={[10, 0]} size="small">证书预警</Badge> },
  ];

  return (
    <PageContainer title="消息中心 / 待办工作台" subTitle="汇总所有待处理事项，快速定位和处理">
      <Spin spinning={loading}>
        {/* 顶部统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statCards.map((s, i) => (
            <Col xs={12} sm={8} md={4} key={i}>
              <Card size="small" hoverable>
                <Statistic
                  title={s.title}
                  value={s.value}
                  valueStyle={{ color: s.value > 0 ? s.color : '#999', fontSize: 28 }}
                  prefix={s.icon}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* 待办列表 */}
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
          {filteredTodos.length === 0 ? (
            <Empty description="暂无待办事项" style={{ padding: '40px 0' }} />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={filteredTodos}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              renderItem={(item: any) => {
                const cfg = typeConfig[item.type] || { color: 'default', label: item.type, icon: <ClockCircleOutlined /> };
                return (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '12px 0' }}
                    onClick={() => item.link && history.push(item.link)}
                    extra={
                      <span style={{ color: '#999', fontSize: 12 }}>
                        {item.time ? new Date(item.time).toLocaleString('zh-CN') : ''}
                      </span>
                    }
                  >
                    <List.Item.Meta
                      avatar={<span style={{ fontSize: 20, color: cfg.color === 'red' ? '#f5222d' : '#1890ff' }}>{cfg.icon}</span>}
                      title={
                        <span>
                          <Tag color={cfg.color} style={{ marginRight: 8 }}>{cfg.label}</Tag>
                          {item.title}
                        </span>
                      }
                      description={item.description}
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default TodoCenter;
