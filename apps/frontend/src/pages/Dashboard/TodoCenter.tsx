import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Badge, Row, Col, Statistic, Spin, Empty, Tabs, Tooltip } from 'antd';
import {
  ClockCircleOutlined, DollarOutlined, AuditOutlined, TeamOutlined,
  WarningOutlined, FileProtectOutlined, ExclamationCircleOutlined,
  FileTextOutlined, NotificationOutlined,
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
  contract_expiry: { color: 'magenta', label: '合同到期', icon: <FileTextOutlined /> },
  unread_announcement: { color: 'cyan', label: '未读公告', icon: <NotificationOutlined /> },
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
    { title: '待审批报销', value: summary.pendingExpenses || 0, color: '#fa8c16', icon: <DollarOutlined />, tab: 'expense' },
    { title: '待审批预算', value: summary.pendingBudgets || 0, color: '#1890ff', icon: <AuditOutlined />, tab: 'budget' },
    { title: '入驻待审', value: summary.pendingApplications || 0, color: '#722ed1', icon: <TeamOutlined />, tab: 'application' },
    { title: '逾期任务', value: summary.overdueTasks || 0, color: '#f5222d', icon: <ExclamationCircleOutlined />, tab: 'task_overdue' },
    { title: '待缴清算', value: summary.unpaidSettlements || 0, color: '#fa541c', icon: <DollarOutlined />, tab: 'settlement' },
    { title: '证书预警', value: summary.certWarnings || 0, color: '#faad14', icon: <WarningOutlined />, tab: 'cert_warning' },
    { title: '合同到期', value: summary.contractExpiry || 0, color: '#eb2f96', icon: <FileTextOutlined />, tab: 'contract_expiry' },
    { title: '未读公告', value: summary.unreadAnnouncements || 0, color: '#13c2c2', icon: <NotificationOutlined />, tab: 'unread_announcement' },
  ];

  const tabItems = [
    { key: 'all', label: <Badge count={allTodos.length} offset={[10, 0]} size="small">全部待办</Badge> },
    { key: 'expense', label: <Badge count={summary.pendingExpenses || 0} offset={[10, 0]} size="small">报销审批</Badge> },
    { key: 'budget', label: <Badge count={summary.pendingBudgets || 0} offset={[10, 0]} size="small">预算审批</Badge> },
    { key: 'application', label: <Badge count={summary.pendingApplications || 0} offset={[10, 0]} size="small">入驻审批</Badge> },
    { key: 'task_overdue', label: <Badge count={summary.overdueTasks || 0} offset={[10, 0]} size="small">逾期任务</Badge> },
    { key: 'settlement', label: <Badge count={summary.unpaidSettlements || 0} offset={[10, 0]} size="small">清算待缴</Badge> },
    { key: 'cert_warning', label: <Badge count={summary.certWarnings || 0} offset={[10, 0]} size="small">证书预警</Badge> },
    { key: 'contract_expiry', label: <Badge count={summary.contractExpiry || 0} offset={[10, 0]} size="small">合同到期</Badge> },
    { key: 'unread_announcement', label: <Badge count={summary.unreadAnnouncements || 0} offset={[10, 0]} size="small">未读公告</Badge> },
  ];

  const getUrgencyTag = (item: any) => {
    if (item.type === 'task_overdue') return <Tag color="red">紧急</Tag>;
    if (item.type === 'contract_expiry') return <Tag color="magenta">即将到期</Tag>;
    if (item.type === 'cert_warning') return <Tag color="gold">预警</Tag>;
    return null;
  };

  return (
    <PageContainer title="消息中心 / 待办工作台" subTitle={`共 ${summary.total || 0} 项待处理事项`}>
      <Spin spinning={loading}>
        {/* 顶部统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statCards.map((s, i) => (
            <Col xs={12} sm={8} md={6} lg={3} key={i}>
              <Card
                size="small"
                hoverable
                onClick={() => setActiveTab(s.tab)}
                style={activeTab === s.tab ? { borderColor: s.color, borderWidth: 2 } : {}}
              >
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
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
              renderItem={(item: any) => {
                const cfg = typeConfig[item.type] || { color: 'default', label: item.type, icon: <ClockCircleOutlined /> };
                return (
                  <List.Item
                    style={{ cursor: item.link ? 'pointer' : 'default', padding: '12px 0' }}
                    onClick={() => item.link && history.push(item.link)}
                    extra={
                      <span style={{ color: '#999', fontSize: 12 }}>
                        {item.time ? new Date(item.time).toLocaleString('zh-CN') : ''}
                      </span>
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <Tooltip title={cfg.label}>
                          <span style={{ fontSize: 22, color: cfg.color === 'red' ? '#f5222d' : cfg.color === 'magenta' ? '#eb2f96' : '#1890ff' }}>
                            {cfg.icon}
                          </span>
                        </Tooltip>
                      }
                      title={
                        <span>
                          <Tag color={cfg.color} style={{ marginRight: 8 }}>{cfg.label}</Tag>
                          {getUrgencyTag(item)}
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
