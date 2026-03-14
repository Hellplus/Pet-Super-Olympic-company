import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Tag, Progress, Badge, Tooltip, Row, Col, Statistic, Alert } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';

const lightConfig: Record<string, { color: string; text: string; icon: any }> = {
  green: { color: '#52c41a', text: '正常', icon: <CheckCircleOutlined /> },
  yellow: { color: '#faad14', text: '预警', icon: <ClockCircleOutlined /> },
  red: { color: '#f5222d', text: '延期', icon: <CloseCircleOutlined /> },
};

const SopProgressPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    request('/api/v1/events/sop-progress-matrix').then((res: any) => {
      setData(res?.data || res || []);
    }).finally(() => setLoading(false));
  }, []);

  const redCount = data.filter(d => d.light === 'red').length;
  const yellowCount = data.filter(d => d.light === 'yellow').length;
  const greenCount = data.filter(d => d.light === 'green').length;

  const columns = [
    { title: '信号灯', dataIndex: 'light', width: 80,
      render: (v: string) => {
        const cfg = lightConfig[v] || lightConfig.green;
        return <Badge color={cfg.color} text={<Tag color={cfg.color}>{cfg.text}</Tag>} />;
      },
      filters: [
        { text: '延期(红)', value: 'red' },
        { text: '预警(黄)', value: 'yellow' },
        { text: '正常(绿)', value: 'green' },
      ],
      onFilter: (v: any, r: any) => r.light === v,
    },
    { title: '赛事名称', dataIndex: 'eventName', width: 200 },
    { title: '承办分会', dataIndex: 'orgName', width: 150 },
    { title: '开赛日期', dataIndex: 'eventDate', width: 120 },
    { title: '进度', dataIndex: 'progress', width: 150,
      render: (v: number) => <Progress percent={v} size="small" status={v >= 100 ? 'success' : 'active'} /> },
    { title: '总任务', dataIndex: 'total', width: 80 },
    { title: '已完成', dataIndex: 'completed', width: 80 },
    { title: '逾期', dataIndex: 'overdue', width: 80,
      render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : <Tag color="green">0</Tag> },
  ];

  return (
    <PageContainer>
      {redCount > 0 && (
        <Alert type="error" message={`有 ${redCount} 场赛事SOP存在延期任务，请立即督办！`}
          showIcon style={{ marginBottom: 16 }} />
      )}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card><Statistic title="正常(绿灯)" value={greenCount} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="预警(黄灯)" value={yellowCount} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="延期(红灯)" value={redCount} valueStyle={{ color: '#f5222d' }} /></Card>
        </Col>
      </Row>
      <Card>
        <Table rowKey="eventId" columns={columns} dataSource={data} loading={loading}
          size="middle" pagination={false} />
      </Card>
    </PageContainer>
  );
};
export default SopProgressPage;
