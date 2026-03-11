import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Spin, Typography, Row, Col, Empty, Table } from 'antd';
import { request } from '@umijs/max';

const { Text } = Typography;

interface AuditDetailProps {
  logId: string;
  onClose?: () => void;
}

const AuditLogDetail: React.FC<AuditDetailProps> = ({ logId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!logId) return;
    request(`/audit-logs/${logId}`).then((res: any) => {
      setData(res?.data || res);
    }).finally(() => setLoading(false));
  }, [logId]);

  if (loading) return <Spin />;
  if (!data) return <Empty />;

  // 计算快照差异
  const diffKeys = new Set<string>();
  const before = data.beforeSnapshot || {};
  const after = data.afterSnapshot || {};
  [...Object.keys(before), ...Object.keys(after)].forEach(k => {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) diffKeys.add(k);
  });

  const diffData = Array.from(diffKeys).map(key => ({
    key, field: key,
    before: before[key] !== undefined ? JSON.stringify(before[key]) : '-',
    after: after[key] !== undefined ? JSON.stringify(after[key]) : '-',
  }));

  return (
    <div>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="操作人">{data.realName} ({data.username})</Descriptions.Item>
        <Descriptions.Item label="操作时间">{new Date(data.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
        <Descriptions.Item label="IP">{data.ip}</Descriptions.Item>
        <Descriptions.Item label="设备">{data.userAgent?.substring(0, 60)}</Descriptions.Item>
        <Descriptions.Item label="模块">{data.module}</Descriptions.Item>
        <Descriptions.Item label="操作">{data.action}</Descriptions.Item>
        <Descriptions.Item label="描述" span={2}>{data.description}</Descriptions.Item>
        <Descriptions.Item label="目标实体">{data.entityName}</Descriptions.Item>
        <Descriptions.Item label="目标ID">{data.entityId}</Descriptions.Item>
        <Descriptions.Item label="状态">
          {data.status === 1 ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="耗时">{data.duration}ms</Descriptions.Item>
        {data.errorMessage && (
          <Descriptions.Item label="错误信息" span={2}>
            <Text type="danger">{data.errorMessage}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      {diffData.length > 0 && (
        <Card title="数据变更对比（操作前 vs 操作后）" size="small" style={{ marginTop: 16 }}>
          <Table
            dataSource={diffData}
            rowKey="field"
            size="small"
            pagination={false}
            columns={[
              { title: '字段', dataIndex: 'field', width: 150 },
              { title: '操作前', dataIndex: 'before',
                render: (v: string) => <Text type="danger" delete>{v}</Text> },
              { title: '操作后', dataIndex: 'after',
                render: (v: string) => <Text type="success">{v}</Text> },
            ]}
          />
        </Card>
      )}

      {diffData.length === 0 && (data.beforeSnapshot || data.afterSnapshot) && (
        <Card title="快照数据" size="small" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            {data.beforeSnapshot && (
              <Col span={12}>
                <Card title="操作前" size="small" type="inner">
                  <pre style={{ fontSize: 12, maxHeight: 300, overflow: 'auto' }}>
                    {JSON.stringify(data.beforeSnapshot, null, 2)}
                  </pre>
                </Card>
              </Col>
            )}
            {data.afterSnapshot && (
              <Col span={12}>
                <Card title="操作后" size="small" type="inner">
                  <pre style={{ fontSize: 12, maxHeight: 300, overflow: 'auto' }}>
                    {JSON.stringify(data.afterSnapshot, null, 2)}
                  </pre>
                </Card>
              </Col>
            )}
          </Row>
        </Card>
      )}
    </div>
  );
};

export default AuditLogDetail;
