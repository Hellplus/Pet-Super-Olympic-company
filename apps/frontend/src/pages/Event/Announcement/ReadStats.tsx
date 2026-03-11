import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Statistic, Row, Col, Button, message, Spin, Progress } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, BellOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';

interface ReadStatsProps {
  announcementId: string;
}

const ReadStats: React.FC<ReadStatsProps> = ({ announcementId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState(false);

  useEffect(() => {
    if (!announcementId) return;
    request(`/events/announcements/${announcementId}/read-stats`).then((res: any) => {
      setData(res?.data || res);
    }).finally(() => setLoading(false));
  }, [announcementId]);

  const handleRemind = async () => {
    setReminding(true);
    try {
      const res = await request(`/events/announcements/${announcementId}/remind`, { method: 'POST' });
      const result = res?.data || res;
      message.success(result?.message || '催读已发送');
    } catch { message.error('催读失败'); }
    finally { setReminding(false); }
  };

  if (loading) return <Spin />;
  if (!data) return null;

  const readRate = data.totalUsers > 0 ? Math.round((data.readCount / data.totalUsers) * 100) : 0;

  const columns = [
    { title: '姓名', dataIndex: 'realName', width: 100 },
    { title: '账号', dataIndex: 'username', width: 120 },
    { title: '状态', key: 'status', width: 80 },
  ];

  const readColumns = columns.map(c => c.key === 'status'
    ? { ...c, render: () => <Tag icon={<CheckCircleOutlined />} color="success">已读</Tag> }
    : c
  );
  const unreadColumns = columns.map(c => c.key === 'status'
    ? { ...c, render: () => <Tag icon={<CloseCircleOutlined />} color="error">未读</Tag> }
    : c
  );

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="总人数" value={data.totalUsers} /></Card></Col>
        <Col span={6}><Card><Statistic title="已读" value={data.readCount} valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="未读" value={data.unreadCount} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        <Col span={6}><Card>
          <Progress type="circle" percent={readRate} width={60} />
          <div style={{ marginTop: 8, textAlign: 'center' }}>已读率</div>
        </Card></Col>
      </Row>

      {data.unreadCount > 0 && (
        <Button type="primary" danger icon={<BellOutlined />}
          onClick={handleRemind} loading={reminding} style={{ marginTop: 16 }}>
          一键催读未读人员 ({data.unreadCount}人)
        </Button>
      )}

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title={`已读 (${data.readCount})`} size="small">
            <Table dataSource={data.readList} columns={readColumns}
              rowKey="id" size="small" pagination={{ pageSize: 10 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={`未读 (${data.unreadCount})`} size="small">
            <Table dataSource={data.unreadList} columns={unreadColumns}
              rowKey="id" size="small" pagination={{ pageSize: 10 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReadStats;
