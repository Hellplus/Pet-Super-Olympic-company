import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-components';
import { Button, message, Tag, Space, Modal, Timeline } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import * as api from '@/services/branchHr';

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待初审', color: 'default' }, 1: { text: '初审通过', color: 'processing' },
  2: { text: '复审通过', color: 'processing' }, 3: { text: '已建档', color: 'success' }, 9: { text: '已拒绝', color: 'error' },
};

const ApplicationPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [recordsVisible, setRecordsVisible] = useState(false);

  const columns: ProColumns[] = [
    { title: '拟设分会', dataIndex: 'branchName', width: 180 },
    { title: '申请人', dataIndex: 'applicantName', width: 100, hideInSearch: true },
    { title: '联系电话', dataIndex: 'applicantPhone', width: 130, hideInSearch: true },
    { title: '省/市', width: 120, hideInSearch: true, render: (_, r) => r.province + ' ' + r.city },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (_, r) => { const s = statusMap[r.status]; return <Tag color={s?.color}>{s?.text}</Tag>; },
      valueEnum: { 0: '待初审', 1: '初审通过', 2: '复审通过', 3: '已建档', 9: '已拒绝' },
    },
    { title: '申请时间', dataIndex: 'createdAt', valueType: 'dateTime', width: 170, hideInSearch: true },
    {
      title: '操作', width: 220, valueType: 'option',
      render: (_, r) => (
        <Space>
          {r.status < 3 && r.status !== 9 && (
            <>
              <a onClick={async () => { await api.approveApplication(r.id, { result: 1, opinion: '同意' }); message.success('审批通过'); actionRef.current?.reload(); }}>通过</a>
              <a style={{ color: 'red' }} onClick={async () => { await api.approveApplication(r.id, { result: 2, rejectReason: '不符合条件' }); message.success('已拒绝'); actionRef.current?.reload(); }}>拒绝</a>
            </>
          )}
          <a onClick={async () => { const res = await api.getApprovalRecords(r.id); setRecords(res.data || []); setRecordsVisible(true); }}>审批记录</a>
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
        onFinish={async (values) => { await api.createApplication(values); message.success('申请已提交'); actionRef.current?.reload(); return true; }}>
        <ProFormText name="branchName" label="拟设分会名称" rules={[{ required: true }]} />
        <ProFormText name="applicantName" label="申请人" rules={[{ required: true }]} />
        <ProFormText name="applicantPhone" label="联系电话" rules={[{ required: true }]} />
        <ProFormText name="province" label="省份" rules={[{ required: true }]} />
        <ProFormText name="city" label="城市" rules={[{ required: true }]} />
        <ProFormTextArea name="businessPlan" label="商业计划说明" />
      </ModalForm>
      <Modal title="审批记录" open={recordsVisible} onCancel={() => setRecordsVisible(false)} footer={null}>
        <Timeline items={records.map((r: any) => ({
          color: r.result === 1 ? 'green' : r.result === 2 ? 'red' : 'gray',
          children: r.stepName + ' - ' + r.approverName + ': ' + (r.result === 1 ? '通过' : r.result === 2 ? '拒绝' : '待处理') + (r.opinion ? ' (' + r.opinion + ')' : ''),
        }))} />
      </Modal>
    </PageContainer>
  );
};
export default ApplicationPage;
