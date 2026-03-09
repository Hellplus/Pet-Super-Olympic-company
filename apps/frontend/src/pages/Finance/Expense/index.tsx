import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormDigit, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import { Button, message, Tag, Space, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import * as api from '@/services/finance';

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' }, 1: { text: '待审批', color: 'processing' }, 2: { text: '审批中', color: 'processing' },
  3: { text: '已通过', color: 'success' }, 4: { text: '已驳回', color: 'error' }, 5: { text: '已付款', color: 'green' }, 6: { text: '已核销', color: 'cyan' },
};

const ExpensePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);

  const columns: ProColumns[] = [
    { title: '单号', dataIndex: 'expenseNo', width: 150 },
    { title: '类型', dataIndex: 'expenseType', width: 80, valueEnum: { REIMBURSE: '报销', PAYMENT: '付款' } },
    { title: '金额', dataIndex: 'amount', width: 120, valueType: 'money', hideInSearch: true },
    { title: '申请人', dataIndex: 'applicantName', width: 80, hideInSearch: true },
    { title: '状态', dataIndex: 'status', width: 90,
      render: (_, r) => { const s = statusMap[r.status]; return <><Tag color={s?.color}>{s?.text}</Tag>{r.isOverBudget && <Tag color="red">超预算</Tag>}</>; },
      valueEnum: { 0: '草稿', 1: '待审批', 3: '已通过', 4: '已驳回', 5: '已付款' },
    },
    { title: '回单', dataIndex: 'paymentVoucherUrl', width: 80, hideInSearch: true, render: (_, r) => r.paymentVoucherUrl ? <Tag color="green">已上传</Tag> : '-' },
    { title: '摘要', dataIndex: 'description', ellipsis: true, hideInSearch: true },
    {
      title: '操作', width: 200, valueType: 'option',
      render: (_, r) => (
        <Space>
          {r.status === 1 && <>
            <Popconfirm title="通过?" onConfirm={async () => { await api.approveExpense(r.id, true); message.success('已通过'); actionRef.current?.reload(); }}><a>通过</a></Popconfirm>
            <Popconfirm title="驳回?" onConfirm={async () => { await api.approveExpense(r.id, false); message.success('已驳回'); actionRef.current?.reload(); }}><a style={{ color: 'red' }}>驳回</a></Popconfirm>
          </>}
          {r.status === 3 && <a onClick={async () => {
            const url = prompt('请输入银行回单截图URL(必填)');
            if (!url) { message.error('必须上传银行电子回单!'); return; }
            await api.confirmPayment(r.id, { paymentVoucherUrl: url }); message.success('已确认付款'); actionRef.current?.reload();
          }}>确认付款</a>}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable headerTitle="报销/付款单" actionRef={actionRef} rowKey="id" columns={columns}
        request={async (params) => {
          const res = await api.getExpenses({ ...params, page: params.current, pageSize: params.pageSize });
          return { data: res.data?.items || [], total: res.data?.total || 0, success: true };
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>提交报销</Button>,
        ]}
      />
      <ModalForm title="提交报销/付款单" open={modalVisible} onOpenChange={setModalVisible} modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => { await api.createExpense(values); message.success('已提交'); actionRef.current?.reload(); return true; }}>
        <ProFormText name="orgId" label="分会ID" rules={[{ required: true }]} />
        <ProFormSelect name="expenseType" label="类型" rules={[{ required: true }]} valueEnum={{ REIMBURSE: '报销', PAYMENT: '付款' }} />
        <ProFormDigit name="amount" label="金额" rules={[{ required: true }]} min={0.01} fieldProps={{ precision: 2 }} />
        <ProFormText name="budgetId" label="关联预算包ID(选填)" />
        <ProFormText name="budgetSubject" label="关联预算科目(选填)" />
        <ProFormTextArea name="description" label="摘要" />
      </ModalForm>
    </PageContainer>
  );
};
export default ExpensePage;
