import React, { useState } from 'react';
import { PageContainer, ProFormSelect } from '@ant-design/pro-components';
import { Card, Button, Descriptions, Table, Tag, Empty, Spin, message, Row, Col, Statistic, Input, Space, Progress, Divider, Alert } from 'antd';
import { FilePdfOutlined, CheckCircleOutlined, PictureOutlined, ClockCircleOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';

const ReportPage: React.FC = () => {
  const [contractId, setContractId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadReport = async () => {
    if (!contractId) { message.warning('请输入合同ID'); return; }
    setLoading(true);
    try {
      const res = await request(`/sponsorship/delivery/report/${contractId}`);
      setData(res?.data || res);
    } catch { message.error('加载失败，请确认合同ID是否正确'); }
    finally { setLoading(false); }
  };

  // 导出 PDF（后端生成 HTML，前端打印为 PDF）
  const exportPDF = async () => {
    if (!data || !contractId) return;
    setExporting(true);
    try {
      // 尝试后端HTML导出端点
      const res = await request(`/sponsorship/delivery/report/${contractId}/export`, {
        responseType: 'blob',
      });
      // 如果后端返回文件，下载
      if (res instanceof Blob || res?.data instanceof Blob) {
        const blob = res instanceof Blob ? res : res.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `结案报告_${data.contract?.contractNo || contractId}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
        message.success('报告已导出');
      } else {
        // 降级方案：使用前端打印
        exportByPrint();
      }
    } catch {
      // 降级方案：前端打印
      exportByPrint();
    } finally {
      setExporting(false);
    }
  };

  // 前端打印为 PDF（降级方案）
  const exportByPrint = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) { message.error('浏览器阻止了弹窗，请允许弹窗后重试'); return; }

    const contract = data.contract || {};
    const summary = data.summary || {};
    const tasks = data.tasks || [];

    const taskRows = tasks.map((t: any) =>
      `<tr>
        <td>${t.taskName}</td>
        <td>${t.taskType || '-'}</td>
        <td style="text-align:center">${t.quantity || 0}</td>
        <td style="text-align:center">${t.completedQuantity || 0}</td>
        <td style="text-align:center">${t.status === 2 ? '<span style="color:green">已完成</span>' : '<span style="color:#1890ff">执行中</span>'}</td>
        <td style="text-align:center">${t.evidenceCount || 0}</td>
      </tr>`
    ).join('');

    printWin.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"><title>结案报告 - ${contract.contractNo || ''}</title>
      <style>
        body{font-family:SimSun,serif;padding:40px;color:#333}
        h1{text-align:center;color:#1a1a2e;border-bottom:3px double #1a1a2e;padding-bottom:10px}
        h2{color:#1a1a2e;margin-top:30px;border-left:4px solid #1890ff;padding-left:10px}
        table{width:100%;border-collapse:collapse;margin:15px 0}
        th,td{border:1px solid #d9d9d9;padding:8px 12px;text-align:left}
        th{background:#fafafa;font-weight:bold}
        .stats{display:flex;justify-content:space-around;margin:20px 0}
        .stat-item{text-align:center;padding:15px}
        .stat-value{font-size:28px;font-weight:bold;color:#1890ff}
        .stat-label{color:#666;margin-top:4px}
        .footer{margin-top:40px;text-align:center;color:#999;font-size:12px;border-top:1px solid #eee;padding-top:15px}
        .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(0,0,0,0.03);pointer-events:none;z-index:999}
      </style>
    </head><body>
      <div class="watermark">IPOC 内部文件</div>
      <h1>赞助合同结案报告</h1>
      <h2>合同信息</h2>
      <table>
        <tr><th width="120">合同编号</th><td>${contract.contractNo || '-'}</td><th width="120">客户名称</th><td>${contract.clientName || '-'}</td></tr>
        <tr><th>合同金额</th><td>¥${Number(contract.amount || 0).toLocaleString()}</td><th>所属分会</th><td>${contract.orgName || '-'}</td></tr>
        <tr><th>开始日期</th><td>${contract.startDate || '-'}</td><th>结束日期</th><td>${contract.endDate || '-'}</td></tr>
      </table>
      <h2>执行概况</h2>
      <div class="stats">
        <div class="stat-item"><div class="stat-value">${summary.totalTasks || 0}</div><div class="stat-label">总任务数</div></div>
        <div class="stat-item"><div class="stat-value" style="color:#52c41a">${summary.completedTasks || 0}</div><div class="stat-label">已完成</div></div>
        <div class="stat-item"><div class="stat-value">${summary.completionRate || 0}%</div><div class="stat-label">完成率</div></div>
        <div class="stat-item"><div class="stat-value">${summary.totalPhotos || 0}</div><div class="stat-label">证据照片</div></div>
      </div>
      <h2>权益交付明细</h2>
      <table>
        <thead><tr><th>任务名称</th><th>类型</th><th>要求数量</th><th>已完成</th><th>状态</th><th>证据数</th></tr></thead>
        <tbody>${taskRows || '<tr><td colspan="6" style="text-align:center;color:#999">暂无数据</td></tr>'}</tbody>
      </table>
      <div class="footer">
        <p>IPOC 国际宠物奥林匹克超级赛组委会 · 招商合规部</p>
        <p>报告生成时间：${new Date().toLocaleString('zh-CN')}</p>
      </div>
    </body></html>`);
    printWin.document.close();
    setTimeout(() => { printWin.print(); }, 500);
    message.success('已打开打印窗口，请选择「另存为 PDF」');
  };

  const taskColumns = [
    { title: '任务', dataIndex: 'taskName', ellipsis: true },
    { title: '类型', dataIndex: 'taskType', width: 80, render: (v: any) => <Tag>{v || '-'}</Tag> },
    { title: '要求', dataIndex: 'quantity', width: 60, align: 'center' as const },
    { title: '完成', dataIndex: 'completedQuantity', width: 60, align: 'center' as const,
      render: (v: any, record: any) => (
        <span style={{ color: v >= record.quantity ? '#52c41a' : '#faad14', fontWeight: 600 }}>
          {v || 0}
        </span>
      ),
    },
    { title: '进度', dataIndex: 'progress', width: 120,
      render: (_: any, record: any) => {
        const pct = record.quantity > 0 ? Math.round((record.completedQuantity / record.quantity) * 100) : 0;
        return <Progress percent={pct} size="small" status={pct >= 100 ? 'success' : 'active'} />;
      },
    },
    { title: '状态', dataIndex: 'status', width: 80,
      render: (v: any) => v === 2
        ? <Tag icon={<CheckCircleOutlined />} color="success">已完成</Tag>
        : <Tag icon={<ClockCircleOutlined />} color="processing">执行中</Tag> },
    { title: '证据数', dataIndex: 'evidenceCount', width: 80,
      render: (v: any) => <><PictureOutlined style={{ marginRight: 4 }} />{v || 0}</>},
  ];

  return (
    <PageContainer>
      <Card>
        <Alert type="info" showIcon style={{ marginBottom: 16 }}
          message="输入赞助合同ID，系统将自动生成权益交付结案报告，包含合同信息、执行概况和交付明细。" />
        <Space size="middle">
          <Input placeholder="输入合同 ID 或合同编号" value={contractId}
            onChange={e => setContractId(e.target.value)} style={{ width: 400 }}
            prefix={<SearchOutlined />} onPressEnter={loadReport}
            allowClear />
          <Button type="primary" onClick={loadReport} loading={loading} icon={<SearchOutlined />}>
            生成报告
          </Button>
          {data && (
            <Button icon={<DownloadOutlined />} onClick={exportPDF} loading={exporting}
              type="default">
              导出报告
            </Button>
          )}
        </Space>
      </Card>

      <Spin spinning={loading}>
        {data ? (
          <>
            <Card title="合同信息" size="small" style={{ marginTop: 16 }}>
              <Descriptions bordered size="small" column={3}>
                <Descriptions.Item label="合同编号">
                  <Tag color="blue">{data.contract?.contractNo || '-'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="客户名称">{data.contract?.clientName || '-'}</Descriptions.Item>
                <Descriptions.Item label="合同金额">
                  <span style={{ color: '#cf1322', fontWeight: 600 }}>
                    ¥{Number(data.contract?.amount || 0).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="开始日期">{data.contract?.startDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="结束日期">{data.contract?.endDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="所属分会">{data.contract?.orgName || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Card hoverable>
                  <Statistic title="总任务数" value={data.summary?.totalTasks || 0} />
                </Card>
              </Col>
              <Col span={6}>
                <Card hoverable>
                  <Statistic title="已完成" value={data.summary?.completedTasks || 0}
                    valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
                </Card>
              </Col>
              <Col span={6}>
                <Card hoverable>
                  <Statistic title="完成率" value={data.summary?.completionRate || 0} suffix="%"
                    valueStyle={{ color: (data.summary?.completionRate || 0) >= 80 ? '#3f8600' : '#cf1322' }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card hoverable>
                  <Statistic title="证据照片" value={data.summary?.totalPhotos || 0}
                    prefix={<PictureOutlined />} />
                </Card>
              </Col>
            </Row>

            <Card title="权益交付明细" size="small" style={{ marginTop: 16 }}>
              <Table dataSource={data.tasks || []} columns={taskColumns}
                rowKey="taskName" size="small" pagination={false}
                summary={(pageData) => {
                  const totalQty = pageData.reduce((sum, row) => sum + (row.quantity || 0), 0);
                  const totalCompleted = pageData.reduce((sum, row) => sum + (row.completedQuantity || 0), 0);
                  const totalEvidence = pageData.reduce((sum, row) => sum + (row.evidenceCount || 0), 0);
                  return (
                    <Table.Summary.Row style={{ fontWeight: 600, background: '#fafafa' }}>
                      <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                      <Table.Summary.Cell index={1} />
                      <Table.Summary.Cell index={2} align="center">{totalQty}</Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="center">{totalCompleted}</Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <Progress percent={totalQty > 0 ? Math.round((totalCompleted / totalQty) * 100) : 0} size="small" />
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} />
                      <Table.Summary.Cell index={6}><PictureOutlined /> {totalEvidence}</Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>
          </>
        ) : (
          <Card style={{ marginTop: 16 }}>
            <Empty description="请输入合同 ID 生成结案报告" style={{ padding: 60 }} />
          </Card>
        )}
      </Spin>
    </PageContainer>
  );
};

export default ReportPage;
