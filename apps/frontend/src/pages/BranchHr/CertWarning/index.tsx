import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Tag, InputNumber, Button, Alert, Row, Col, Statistic, Space } from 'antd';
import { WarningOutlined, ClockCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';

const CertWarningPage: React.FC = () => {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [daysAhead, setDaysAhead] = useState(30);

  const load = async () => {
    setLoading(true);
    const res = await request(`/api/v1/branch-hr/cert-expiry-warnings?daysAhead=${daysAhead}`);
    setData(res?.data || res || {});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const expiredColumns = [
    { title: '专家', dataIndex: 'expertName', width: 100 },
    { title: '证书名称', dataIndex: 'certName', width: 200 },
    { title: '证书编号', dataIndex: 'certNo', width: 150 },
    { title: '发证机构', dataIndex: 'issuingAuthority', width: 150 },
    { title: '到期日期', dataIndex: 'expiryDate', width: 120, render: (v: string) => <Tag color="red">{v}</Tag> },
  ];

  const soonColumns = [
    ...expiredColumns.slice(0, -1),
    { title: '到期日期', dataIndex: 'expiryDate', width: 120, render: (v: string) => <Tag color="orange">{v}</Tag> },
    { title: '剩余天数', dataIndex: 'daysRemaining', width: 100,
      render: (v: number) => <Tag color={v <= 7 ? 'red' : v <= 14 ? 'orange' : 'gold'}>{v}天</Tag> },
  ];

  return (
    <PageContainer>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic title="已过期证书" value={data.expiredCount || 0} prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: data.expiredCount > 0 ? '#f5222d' : '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic title="即将到期" value={data.expiringSoonCount || 0} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: data.expiringSoonCount > 0 ? '#faad14' : '#52c41a' }} />
          </Col>
          <Col span={12} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>预警范围：</span>
            <InputNumber value={daysAhead} onChange={(v) => v && setDaysAhead(v)} min={1} max={365} addonAfter="天内" />
            <Button type="primary" onClick={load}>查询</Button>
          </Col>
        </Row>

        {data.expiredCount > 0 && (
          <Alert type="error" message={`有 ${data.expiredCount} 本证书已过期，请尽快安排续证！`}
            icon={<WarningOutlined />} showIcon style={{ marginBottom: 16 }} />
        )}

        <Card title="❌ 已过期证书" size="small" style={{ marginBottom: 16 }}>
          <Table rowKey="certId" columns={expiredColumns} dataSource={data.expired || []}
            loading={loading} size="small" pagination={false} />
        </Card>

        <Card title="⚠️ 即将到期证书" size="small">
          <Table rowKey="certId" columns={soonColumns} dataSource={data.expiringSoon || []}
            loading={loading} size="small" pagination={false} />
        </Card>
      </Card>
    </PageContainer>
  );
};
export default CertWarningPage;
