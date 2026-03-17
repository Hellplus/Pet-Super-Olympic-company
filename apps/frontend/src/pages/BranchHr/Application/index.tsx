import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Button, message, Tag, Space, Modal, Timeline, Input, Descriptions } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, HistoryOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import * as api from '@/services/branchHr';

const { TextArea } = Input;

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待初审', color: 'default' }, 1: { text: '初审通过', color: 'processing' },
  2: { text: '复审通过', color: 'processing' }, 3: { text: '已建档', color: 'success' }, 9: { text: '已拒绝', color: 'error' },
};

const ApplicationPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [recordsVisible, setRecordsVisible] = useState(false);

  // 审批弹窗
  const [approvalModal, setApprovalModal] = useState<{ record: any; approve: boolean } | null>(null);
  const [approvalOpinion, setApprovalOpinion] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);

  const handleApproval = async () => {
    if (!approvalModal) return;
    if (!approvalModal.approve && !approvalOpinion.trim()) {
      message.warning('拒绝时必须填写原因');
      return;
    }
    setApprovalLoading(true);
    try {
      await api.approveApplication(approvalModal.record.id, {
        result: approvalModal.approve ? 1 : 2,
        opinion: approvalOpinion || (approvalModal.approve ? '同意' : ''),
        rejectReason: !approvalModal.approve ? approvalOpinion : undefined,
      });
      message.success(approvalModal.approve ? '审批通过' : '已拒绝');
      setApprovalModal(null);
      setApprovalOpinion('');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error?.data?.message || '操作失败');
    } finally { setApprovalLoading(false); }
  };

  const columns: ProColumns[] = [
    { title: '拟设分会', dataIndex: 'branchName', width: 180 },
    { title: '申请人', dataIndex: 'applicantName', width: 100, hideInSearch: true },
    { title: '联系电话', dataIndex: 'applicantPhone', width: 130, hideInSearch: true },
    { title: '省/市', width: 120, hideInSearch: true, render: (_, r) => r.province + ' ' + r.city },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (_, r) => { const s = statusMap[r.status]; return <Tag color={s?.color}>{s?.text}</Tag>; },
      valueEnum: { 0: '待初审', 1: '初审通过', 2: '复审通过', 3: '已建档', 9: '已拒绝' },
    },
    { title: '商业计划', dataIndex: 'businessPlan', ellipsis: true, width: 200, hideInSearch: true },
    { title: '申请时间', dataIndex: 'createdAt', valueType: 'dateTime', width: 170, hideInSearch: true },
    {
      title: '操作', width: 220, valueType: 'option',
      render: (_, r) => (
        <Space>
          {r.status < 3 && r.status !== 9 && (
            <>
              <a onClick={() => { setApprovalModal({ record: r, approve: true }); setApprovalOpinion(''); }}>
                <CheckOutlined /> 通过
              </a>
              <a style={{ color: 'red' }} onClick={() => { setApprovalModal({ record: r, approve: false }); setApprovalOpinion(''); }}>
                <CloseOutlined /> 拒绝
              </a>
            </>
          )}
          <a onClick={async () => { const res = await api.getApprovalRecords(r.id); setRecords(res.data || []); setRecordsVisible(true); }}>
            <HistoryOutlined /> 审批记录
          </a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable headerTitle="分会入驻申请" actionRef={actionRef} rowKey="id" columns={columns}
        request={async (params) => {
          const res = await api.getApplications({ ...params, page: params.current, pageSize: params.pageSize });
          return { data: res.data?.items || [], total: res.data?.total || 0, success: true };
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>模拟提交申请</Button>,
        ]}
      />
      <ModalForm title="提交入驻申请" open={modalVisible} onOpenChange={setModalVisible} modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await api.createApplication(values);
            message.success('申请已提交');
            actionRef.current?.reload();
            return true;
          } catch (error: any) {
            message.error(error?.data?.message || error?.message || '提交失败');
            return false;
          }
        }}>
        <ProFormText name="branchName" label="拟设分会名称" rules={[{ required: true, message: '请输入分会名称' }]} />
        <ProFormText name="applicantName" label="申请人" rules={[{ required: true, message: '请输入申请人' }]} />
        <ProFormText name="applicantPhone" label="联系电话" rules={[
          { required: true, message: '请输入联系电话' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
        ]} />
        <ProFormText name="province" label="省份" rules={[{ required: true, message: '请输入省份' }]} />
        <ProFormText name="city" label="城市" rules={[{ required: true, message: '请输入城市' }]} />
        <ProFormTextArea name="businessPlan" label="商业计划说明" />
      </ModalForm>

      {/* 审批弹窗 */}
      <Modal
        title={approvalModal?.approve ? '审批通过' : '拒绝入驻申请'}
        open={!!approvalModal}
        onCancel={() => setApprovalModal(null)}
        onOk={handleApproval}
        okText={approvalModal?.approve ? '确认通过' : '确认拒绝'}
        okButtonProps={{ loading: approvalLoading, danger: !approvalModal?.approve }}
        destroyOnClose
      >
        {approvalModal && (
          <>
            <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="拟设分会">{approvalModal.record.branchName}</Descriptions.Item>
              <Descriptions.Item label="申请人">{approvalModal.record.applicantName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{approvalModal.record.applicantPhone}</Descriptions.Item>
              <Descriptions.Item label="省/市">{approvalModal.record.province} {approvalModal.record.city}</Descriptions.Item>
              {approvalModal.record.businessPlan && (
                <Descriptions.Item label="商业计划">{approvalModal.record.businessPlan}</Descriptions.Item>
              )}
            </Descriptions>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                {approvalModal.approve ? '审批意见：' : '拒绝原因（必填）：'}
              </div>
              <TextArea
                rows={3}
                placeholder={approvalModal.approve ? '选填，如：符合条件，同意入驻' : '请说明拒绝原因'}
                value={approvalOpinion}
                onChange={(e) => setApprovalOpinion(e.target.value)}
              />
            </div>
          </>
        )}
      </Modal>

      {/* 审批记录 */}
      <Modal title="审批记录" open={recordsVisible} onCancel={() => setRecordsVisible(false)} footer={null}>
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无审批记录</div>
        ) : (
          <Timeline items={records.map((r: any) => ({
            color: r.result === 1 ? 'green' : r.result === 2 ? 'red' : 'gray',
            children: (
              <div>
                <div style={{ fontWeight: 500 }}>
                  <Tag color={r.result === 1 ? 'green' : r.result === 2 ? 'red' : 'default'}>
                    {r.stepName || (r.result === 1 ? '通过' : r.result === 2 ? '拒绝' : '待处理')}
                  </Tag>
                  <span style={{ color: '#999', fontSize: 12 }}>{r.approverName}</span>
                </div>
                {r.opinion && <div style={{ margin: '4px 0', color: '#666' }}>{r.opinion}</div>}
                {r.createdAt && <div style={{ fontSize: 12, color: '#999' }}>{new Date(r.createdAt).toLocaleString('zh-CN')}</div>}
              </div>
            ),
          }))} />
        )}
      </Modal>
    </PageContainer>
  );
};
export default ApplicationPage;
