import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormDigit, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import { Button, message, Tag, Space, Popconfirm, Modal, Upload, Alert, Typography, Divider } from 'antd';
import { PlusOutlined, UploadOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import * as api from '@/services/finance';

const { Text } = Typography;

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' }, 1: { text: '待审批', color: 'processing' }, 2: { text: '审批中', color: 'processing' },
  3: { text: '已通过', color: 'success' }, 4: { text: '已驳回', color: 'error' }, 5: { text: '已付款', color: 'green' }, 6: { text: '已核销', color: 'cyan' },
};

const ExpensePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [voucherUrl, setVoucherUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /** 预算校验 — 超预算直接拦截 */
  const checkBudget = async (budgetId: string, budgetSubject: string, amount: number) => {
    if (!budgetId) return true;
    try {
      const res = await request('/finance/budget-check', { method: 'POST', data: { budgetId, subject: budgetSubject, amount } });
      if (res.data?.isOverBudget) {
        setBudgetWarning({ remaining: res.data.remainingAmount, amount, overage: amount - (res.data.remainingAmount || 0) });
        return false;
      }
      return true;
    } catch { return true; }
  };

  /** 确认付款（强制凭证上传闭环） */
  const handleConfirmPayment = async () => {
    if (!voucherUrl) { message.error('必须上传银行电子回单截图才能完成付款确认！'); return; }
    setSubmitting(true);
    try {
      await api.confirmPayment(paymentModal.id, { paymentVoucherUrl: voucherUrl });
      message.success('付款已确认，凭证已归档');
      setPaymentModal(null); setVoucherUrl('');
      actionRef.current?.reload();
    } finally { setSubmitting(false); }
  };

  const columns: ProColumns[] = [
    { title: '单号', dataIndex: 'expenseNo', width: 160, copyable: true },
    { title: '类型', dataIndex: 'expenseType', width: 80, valueEnum: { REIMBURSE: '报销', PAYMENT: '付款' } },
    { title: '金额(元)', dataIndex: 'amount', width: 120, hideInSearch: true,
      render: (_, r) => <Text strong style={{ color: r.isOverBudget ? '#ff4d4f' : undefined }}>¥{r.amount?.toLocaleString()}</Text>,
    },
    { title: '关联预算', dataIndex: 'budgetSubject', width: 100, hideInSearch: true, render: (_, r) => r.budgetSubject || <Text type="secondary">无</Text> },
    { title: '申请人', dataIndex: 'applicantName', width: 80, hideInSearch: true },
    { title: '状态', dataIndex: 'status', width: 120,
      render: (_, r) => {
        const s = statusMap[r.status];
        return <Space size={4}><Tag color={s?.color}>{s?.text}</Tag>{r.isOverBudget && <Tag color="red" icon={<ExclamationCircleOutlined />}>超预算</Tag>}</Space>;
      },
      valueEnum: { 0: '草稿', 1: '待审批', 3: '已通过', 4: '已驳回', 5: '已付款' },
    },
    { title: '回单凭证', dataIndex: 'paymentVoucherUrl', width: 90, hideInSearch: true,
      render: (_, r) => r.paymentVoucherUrl ? <Tag color="green" icon={<CheckCircleOutlined />}>已上传</Tag> : (r.status >= 3 ? <Tag color="orange">待上传</Tag> : '-'),
    },
    { title: '摘要', dataIndex: 'description', ellipsis: true, hideInSearch: true },
    { title: '提交时间', dataIndex: 'createdAt', width: 170, valueType: 'dateTime', hideInSearch: true, sorter: true },
    { title: '操作', width: 220, valueType: 'option', fixed: 'right',
      render: (_, r) => (
        <Space>
          {r.status === 1 && <>
            <Popconfirm title="确认通过此报销单？" onConfirm={async () => { await api.approveExpense(r.id, true); message.success('审批通过'); actionRef.current?.reload(); }}><a>通过</a></Popconfirm>
            <Popconfirm title="确认驳回此报销单？" onConfirm={async () => { await api.approveExpense(r.id, false); message.success('已驳回'); actionRef.current?.reload(); }}><a style={{ color: '#ff4d4f' }}>驳回</a></Popconfirm>
          </>}
          {r.status === 3 && <Button type="link" size="small" icon={<UploadOutlined />} onClick={() => { setPaymentModal(r); setVoucherUrl(''); }}>确认付款</Button>}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable headerTitle="报销/付款单" actionRef={actionRef} rowKey="id" columns={columns} scroll={{ x: 1300 }}
        request={async (params) => {
          const res = await api.getExpenses({ ...params, page: params.current, pageSize: params.pageSize });
          return { data: res.data?.items || [], total: res.data?.total || 0, success: true };
        }}
        toolBarRender={() => [<Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => { setBudgetWarning(null); setModalVisible(true); }}>提交报销</Button>]}
      />

      {/* 新建报销单 — 含预算硬拦截 */}
      <ModalForm title="提交报销/付款单" open={modalVisible} onOpenChange={(v) => { setModalVisible(v); if (!v) setBudgetWarning(null); }} modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          if (values.budgetId) { const ok = await checkBudget(values.budgetId, values.budgetSubject, values.amount); if (!ok) return false; }
          await api.createExpense(values);
          message.success('报销单已提交');
          actionRef.current?.reload();
          return true;
        }}>
        {budgetWarning && (
          <Alert type="error" showIcon icon={<ExclamationCircleOutlined />} message="超预算拦截"
            description={<div><p>本次报销金额 <Text strong type="danger">¥{budgetWarning.amount?.toLocaleString()}</Text> 超出预算余额 <Text strong>¥{budgetWarning.remaining?.toLocaleString()}</Text>，超支 <Text strong type="danger">¥{budgetWarning.overage?.toLocaleString()}</Text>。</p><p>请联系总部发起《超预算特批申请》后再提交。</p></div>}
            style={{ marginBottom: 16 }} />
        )}
        <ProFormSelect name="expenseType" label="类型" rules={[{ required: true, message: '请选择类型' }]} valueEnum={{ REIMBURSE: '报销', PAYMENT: '付款' }} />
        <ProFormDigit name="amount" label="金额(元)" rules={[{ required: true, message: '请输入金额' }]} min={0.01} fieldProps={{ precision: 2, style: { width: '100%' } }} />
        <ProFormText name="budgetId" label="关联预算包ID" tooltip="关联预算包后将进行实时预算余额校验" placeholder="选填，关联后系统将自动扣减预算" />
        <ProFormText name="budgetSubject" label="关联预算科目" placeholder="如：场地费、宣发费等" />
        <ProFormTextArea name="description" label="摘要说明" rules={[{ required: true, message: '请填写摘要' }]} />
      </ModalForm>

      {/* 付款凭证强制上传弹窗 */}
      <Modal title={<><UploadOutlined /> 确认付款 — 强制上传银行回单</>} open={!!paymentModal} onCancel={() => setPaymentModal(null)}
        onOk={handleConfirmPayment} okText="确认付款并归档" okButtonProps={{ disabled: !voucherUrl, loading: submitting }} destroyOnClose>
        <Alert type="warning" showIcon message="付款凭证闭环核销" description="出纳在线下网银完成打款后，必须在此上传银行电子回单截图/PDF，无附件无法完结单据。" style={{ marginBottom: 16 }} />
        {paymentModal && <div style={{ marginBottom: 16 }}><Text>单号：<Text strong>{paymentModal.expenseNo}</Text></Text><Divider type="vertical" /><Text>金额：<Text strong type="danger">¥{paymentModal.amount?.toLocaleString()}</Text></Text></div>}
        <ProFormText label="银行回单文件URL" placeholder="上传回单后粘贴URL，或直接输入OSS地址"
          fieldProps={{ value: voucherUrl, onChange: (e: any) => setVoucherUrl(e.target.value),
            addonAfter: <Upload accept=".jpg,.jpeg,.png,.pdf" showUploadList={false}
              customRequest={async ({ file, onSuccess }: any) => {
                const formData = new FormData(); formData.append('file', file);
                try { const res = await request('/upload', { method: 'POST', data: formData }); if (res.data?.url) { setVoucherUrl(res.data.url); message.success('回单上传成功'); } onSuccess?.({}, file); } catch { message.error('上传失败'); }
              }}><Button size="small" icon={<UploadOutlined />}>上传</Button></Upload>,
          }} />
        {!voucherUrl && <Text type="danger" style={{ fontSize: 12 }}>* 必须上传银行电子回单才能确认付款</Text>}
      </Modal>
    </PageContainer>
  );
};
export default ExpensePage;
