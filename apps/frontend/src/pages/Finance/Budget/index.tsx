import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Button, Tag, Space, message, Progress, Modal, Input, Drawer, Timeline, Descriptions, Typography } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, HistoryOutlined } from '@ant-design/icons';
import * as api from '@/services/finance';

const { Text } = Typography;
const { TextArea } = Input;

const resultMap: Record<number, { text: string; color: string }> = {
  0: { text: '转签', color: 'blue' }, 1: { text: '通过', color: 'green' }, 2: { text: '驳回', color: 'red' },
};

const BudgetPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 审批弹窗
  const [approvalModal, setApprovalModal] = useState<{ record: any; approve: boolean } | null>(null);
  const [approvalOpinion, setApprovalOpinion] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);

  // 审批记录抽屉
  const [historyDrawer, setHistoryDrawer] = useState<any>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = async () => { setLoading(true); const res = await api.getBudgets(); setData(res.data || []); setLoading(false); };
  useEffect(() => { load(); }, []);

  const statusMap: Record<number, { text: string; color: string }> = {
    0: { text: '待审批', color: 'orange' }, 1: { text: '已锁定', color: 'green' }, 2: { text: '已驳回', color: 'red' }, 3: { text: '已结案', color: 'default' },
  };

  const handleApproval = async () => {
    if (!approvalModal) return;
    setApprovalLoading(true);
    try {
      await api.approveBudget(approvalModal.record.id, approvalModal.approve, approvalOpinion);
      message.success(approvalModal.approve ? '审批通过' : '已驳回');
      setApprovalModal(null);
      setApprovalOpinion('');
      load();
    } catch (error: any) {
      message.error(error?.data?.message || '操作失败');
    } finally { setApprovalLoading(false); }
  };

  const showHistory = async (record: any) => {
    setHistoryDrawer(record);
    setHistoryLoading(true);
    try {
      const res = await api.getApprovalRecords('BUDGET', record.id);
      setHistoryRecords(res.data || res || []);
    } catch { setHistoryRecords([]); }
    setHistoryLoading(false);
  };

  const columns = [
    { title: '赛事名称', dataIndex: 'eventName', width: 200 },
    { title: '分会', dataIndex: ['organization', 'name'], width: 150 },
    { title: '预算总额', dataIndex: 'totalBudget', width: 120, render: (v: number) => '¥' + Number(v).toLocaleString() },
    { title: '已使用', dataIndex: 'usedAmount', width: 120, render: (v: number) => '¥' + Number(v).toLocaleString() },
    { title: '消耗率', width: 150, render: (_: any, r: any) => {
      const pct = r.totalBudget > 0 ? Math.round(Number(r.usedAmount) / Number(r.totalBudget) * 100) : 0;
      return <Progress percent={pct} size="small" status={pct > 90 ? 'exception' : 'normal'} />;
    }},
    { title: '状态', dataIndex: 'status', width: 100, render: (v: number) => { const s = statusMap[v]; return <Tag color={s?.color}>{s?.text}</Tag>; }},
    { title: '操作', width: 220, render: (_: any, r: any) => (
      <Space>
        {r.status === 0 && <>
          <Button size="small" type="primary" icon={<CheckOutlined />}
            onClick={() => { setApprovalModal({ record: r, approve: true }); setApprovalOpinion(''); }}>通过</Button>
          <Button size="small" danger icon={<CloseOutlined />}
            onClick={() => { setApprovalModal({ record: r, approve: false }); setApprovalOpinion(''); }}>驳回</Button>
        </>}
        <Button size="small" type="link" icon={<HistoryOutlined />} onClick={() => showHistory(r)}>审批记录</Button>
      </Space>
    )},
  ];

  return (
    <PageContainer>
      <Card><Table rowKey="id" columns={columns} dataSource={data} loading={loading} size="small" /></Card>

      {/* 审批弹窗（含意见） */}
      <Modal
        title={approvalModal?.approve ? '审批通过预算包' : '驳回预算包'}
        open={!!approvalModal}
        onCancel={() => setApprovalModal(null)}
        onOk={handleApproval}
        okText={approvalModal?.approve ? '确认通过' : '确认驳回'}
        okButtonProps={{ loading: approvalLoading, danger: !approvalModal?.approve }}
        destroyOnClose
      >
        {approvalModal && (
          <>
            <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="赛事名称">{approvalModal.record.eventName}</Descriptions.Item>
              <Descriptions.Item label="预算总额"><Text strong>¥{Number(approvalModal.record.totalBudget).toLocaleString()}</Text></Descriptions.Item>
            </Descriptions>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>审批意见：</div>
              <TextArea
                rows={3}
                placeholder={approvalModal.approve ? '选填，如：同意立项' : '请填写驳回原因'}
                value={approvalOpinion}
                onChange={(e) => setApprovalOpinion(e.target.value)}
              />
            </div>
          </>
        )}
      </Modal>

      {/* 审批记录抽屉 */}
      <Drawer
        title={<><HistoryOutlined /> 审批记录 — {historyDrawer?.eventName}</>}
        open={!!historyDrawer}
        onClose={() => setHistoryDrawer(null)}
        width={480}
      >
        {historyDrawer && (
          <Descriptions size="small" column={1} bordered style={{ marginBottom: 24 }}>
            <Descriptions.Item label="赛事名称">{historyDrawer.eventName}</Descriptions.Item>
            <Descriptions.Item label="预算总额">¥{Number(historyDrawer.totalBudget).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="当前状态"><Tag color={statusMap[historyDrawer.status]?.color}>{statusMap[historyDrawer.status]?.text}</Tag></Descriptions.Item>
          </Descriptions>
        )}
        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
        ) : historyRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无审批记录</div>
        ) : (
          <Timeline
            items={historyRecords.map((r: any) => {
              const rs = resultMap[r.result] || { text: '未知', color: 'default' };
              return {
                color: rs.color,
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      <Tag color={rs.color} style={{ marginRight: 8 }}>{r.stepName || rs.text}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>{r.approverName}</Text>
                    </div>
                    {r.opinion && <div style={{ margin: '4px 0', color: '#666' }}>{r.opinion}</div>}
                    <div style={{ fontSize: 12, color: '#999' }}>{r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : ''}</div>
                  </div>
                ),
              };
            })}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};
export default BudgetPage;
