import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Button, Descriptions, Table, Tag, Progress, Empty, Spin, message, Row, Col, Statistic, Input } from 'antd';
import { FilePdfOutlined, CheckCircleOutlined, PictureOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';

const ReportPage: React.FC = () => {
  const [contractId, setContractId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    if (!contractId) { message.warning('请输入合同ID'); return; }
    setLoading(true);
    try {
      const res = await request(`/sponsorship/delivery/report/${contractId}`);
      setData(res?.data || res);
    } catch { message.error('加载失败'); }
    finally { setLoading(false); }
  };

  const taskColumns = [
    { title: '任务', dataIndex: 'taskName' },
    { title: '类型', dataIndex: 'taskType', width: 80, render: (v: any) => <Tag>{v}</Tag> },
    { title: '要求', dataIndex: 'quantity', width: 60 },
    { title: '完成', dataIndex: 'completedQuantity', width: 60 },
    { title: '状态', dataIndex: 'status', width: 80,
      render: (v: any) => v === 2 ? <Tag color="success">已完成</Tag> : <Tag color="processing">执行中</Tag> },
    { title: '证据数', dataIndex: 'evidenceCount', width: 80,
      render: (v: any) => <><PictureOutlined /> {v}</>},
  ];

  return (
    <PageContainer>
      <Card>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Input placeholder="输入合同ID" value={contractId}
            onChange={e => setContractId(e.target.value)} style={{ width: 400 }} />
          <Button type="primary" onClick={loadReport} loading={loading}>生成报告</Button>
          {data && <Button icon={<FilePdfOutlined />}
            onClick={() => message.info('PDF导出功能开发中')}>
            导出PDF报告</Button>}
        </div>
      </Card>

      <Spin spinning={loading}>
        {data ? (
          <>
            <Card title="合同信息" size="small" style={{ marginTop: 16 }}>
              <Descriptions bordered size="small" column={3}>
                <Descriptions.Item label="合同编号">{data.contract?.contractNo}</Descriptions.Item>
                <Descriptions.Item label="客户">{data.contract?.clientName}</Descriptions.Item>
                <Descriptions.Item label="金额">￥{Number(data.contract?.amount || 0).toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="开始日期">{data.contract?.startDate}</Descriptions.Item>
                <Descriptions.Item label="结束日期">{data.contract?.endDate}</Descriptions.Item>
                <Descriptions.Item label="所属分会">{data.contract?.orgName}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Card><Statistic title="总任务数" value={data.summary?.totalTasks} /></Card>
              </Col>
              <Col span={6}>
                <Card><Statistic title="已完成" value={data.summary?.completedTasks}
                  valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} /></Card>
              </Col>
              <Col span={6}>
                <Card><Statistic title="完成率" value={data.summary?.completionRate} suffix="%" /></Card>
              </Col>
              <Col span={6}>
                <Card><Statistic title="证据照片" value={data.summary?.totalPhotos}
                  prefix={<PictureOutlined />} /></Card>
              </Col>
            </Row>

            <Card title="权益交付明细" size="small" style={{ marginTop: 16 }}>
              <Table dataSource={data.tasks} columns={taskColumns}
                rowKey="taskName" size="small" pagination={false} />
            </Card>
          </>
        ) : (
          <Empty description="请输入合同ID生成报告" style={{ marginTop: 60 }} />
        )}
      </Spin>
    </PageContainer>
  );
};

export default ReportPage;
