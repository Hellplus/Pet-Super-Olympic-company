import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormDigit, ProFormDatePicker, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import { Button, message, Tag, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import * as api from '@/services/sponsorship';

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' }, 1: { text: '生效', color: 'green' }, 2: { text: '已完结', color: 'cyan' }, 3: { text: '已终止', color: 'red' },
};

const ContractPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);

  const columns: ProColumns[] = [
    { title: '合同编号', dataIndex: 'contractNo', width: 150 },
    { title: '赞助商', dataIndex: ['client', 'companyName'], width: 200, hideInSearch: true },
    { title: '分会', dataIndex: ['organization', 'name'], width: 150, hideInSearch: true },
    { title: '赞助级别', dataIndex: 'sponsorLevel', width: 100, valueEnum: { TITLE: '冠名', GOLD: '金牌', SILVER: '银牌', OTHER: '其他' } },
    { title: '合同金额', dataIndex: 'amount', width: 120, valueType: 'money', hideInSearch: true },
    { title: '已收款', dataIndex: 'paidAmount', width: 120, valueType: 'money', hideInSearch: true },
    { title: '有效期', width: 200, hideInSearch: true, render: (_, r) => (r.startDate || '') + ' ~ ' + (r.endDate || '') },
    { title: '状态', dataIndex: 'status', width: 80,
      render: (_, r) => { const s = statusMap[r.status]; return <Tag color={s?.color}>{s?.text}</Tag>; },
      valueEnum: { 0: '草稿', 1: '生效', 2: '已完结', 3: '已终止' },
    },
    {
      title: '操作', width: 150, valueType: 'option',
      render: (_, r) => (
        <Space>
          {r.status === 0 && <a onClick={async () => { await api.activateContract(r.id); message.success('已生效'); actionRef.current?.reload(); }}>生效</a>}
          {r.status === 1 && <a onClick={async () => {
            const tasks = [{ taskName: '示例权益-A字板x2', taskType: 'BOARD', quantity: 2 }];
            await api.decomposeRights(r.id, tasks); message.success('权益已拆包');
          }}>权益拆包</a>}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable headerTitle="赞助合同" actionRef={actionRef} rowKey="id" columns={columns}
        request={async (params) => {
          const res = await api.getContracts({ ...params, page: params.current, pageSize: params.pageSize });
          return { data: res.data?.items || [], total: res.data?.total || 0, success: true };
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新建合同</Button>,
        ]}
      />
      <ModalForm title="新建赞助合同" open={modalVisible} onOpenChange={setModalVisible} modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => { await api.createContract(values); message.success('创建成功'); actionRef.current?.reload(); return true; }}>
        <ProFormText name="orgId" label="分会ID" rules={[{ required: true }]} />
        <ProFormText name="clientId" label="客户ID" rules={[{ required: true }]} />
        <ProFormSelect name="sponsorLevel" label="赞助级别" rules={[{ required: true }]} valueEnum={{ TITLE: '冠名', GOLD: '金牌', SILVER: '银牌', OTHER: '其他' }} />
        <ProFormDigit name="amount" label="合同金额" rules={[{ required: true }]} min={0} fieldProps={{ precision: 2 }} />
        <ProFormDatePicker name="startDate" label="开始日期" rules={[{ required: true }]} />
        <ProFormDatePicker name="endDate" label="到期日期" rules={[{ required: true }]} />
        <ProFormTextArea name="rightsDesc" label="权益描述" />
      </ModalForm>
    </PageContainer>
  );
};
export default ContractPage;
