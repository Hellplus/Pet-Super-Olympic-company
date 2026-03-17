import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormDigit, ProFormSelect, ProFormTextArea, ProFormTreeSelect } from '@ant-design/pro-components';
import { Button, message, Tag, Space, Modal, Upload, Alert, Typography, Divider, Input, Drawer, Timeline, Descriptions, Select } from 'antd';
import { PlusOutlined, UploadOutlined, ExclamationCircleOutlined, CheckCircleOutlined, HistoryOutlined, SendOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import * as api from '@/services/finance';
import * as orgApi from '@/services/organization';
import * as userApi from '@/services/user';
import ImportExport from '@/components/ImportExport';
import { exportExpenses } from '@/services/export';

const { Text } = Typography;
const { TextArea } = Input;

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' }, 1: { text: '待审批', color: 'processing' }, 2: { text: '审批中', color: 'processing' },
  3: { text: '已通过', color: 'success' }, 4: { text: '已驳回', color: 'error' }, 5: { text: '已付款', color: 'green' }, 6: { text: '已核销', color: 'cyan' },
  10: { text: '超预算特批', color: 'warning' },
};

const resultMap: Record<number, { text: string; color: string }> = {
  0: { text: '转签', color: 'blue' }, 1: { text: '通过', color: 'green' }, 2: { text: '驳回', color: 'red' }, 3: { text: '退回', color: 'orange' },
};

const ExpensePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [budgetWarning, setBudgetWarning] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [voucherUrl, setVoucherUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 审批弹窗
  const [approvalModal, setApprovalModal] = useState<{ record: any; approve: boolean } | null>(null);
  const [approvalOpinion, setApprovalOpinion] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);

  // 审批记录抽屉
  const [historyDrawer, setHistoryDrawer] = useState<any>(null);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 转签弹窗
  const [forwardModal, setForwardModal] = useState<any>(null);
  const [forwardUserId, setForwardUserId] = useState('');
  const [forwardUserName, setForwardUserName] = useState('');
  const [forwardOpinion, setForwardOpinion] = useState('');
  const [forwardLoading, setForwardLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<any[]>([]);

  const loadOrgTree = async () => {
    try {
      const res = await orgApi.getOrgTree();
      const transform = (nodes: any[]): any[] =>
        nodes?.map((n) => ({ title: n.name, value: n.id, children: n.children ? transform(n.children) : [] })) || [];
      return transform(res.data || res || []);
    } catch { return []; }
  };

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

  const handleConfirmPayment = async () => {
    if (!voucherUrl) { message.error('必须上传银行电子回单截图才能完成付款确认！'); return; }
    setSubmitting(true);
    try {
      await api.confirmPayment(paymentModal.id, { paymentVoucherUrl: voucherUrl });
      message.success('付款已确认，凭证已归档');
      setPaymentModal(null); setVoucherUrl('');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error?.data?.message || '付款确认失败');
    } finally { setSubmitting(false); }
  };

  // 审批操作
  const handleApproval = async () => {
    if (!approvalModal) return;
    setApprovalLoading(true);
    try {
      await api.approveExpense(approvalModal.record.id, approvalModal.approve, approvalOpinion);
      message.success(approvalModal.approve ? '审批通过' : '已驳回');
      setApprovalModal(null);
      setApprovalOpinion('');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error?.data?.message || '操作失败');
    } finally { setApprovalLoading(false); }
  };

  // 查看审批记录
  const showHistory = async (record: any) => {
    setHistoryDrawer(record);
    setHistoryLoading(true);
    try {
      const res = await api.getApprovalRecords('EXPENSE', record.id);
      setHistoryRecords(res.data || res || []);
    } catch { setHistoryRecords([]); }
    setHistoryLoading(false);
  };

  // 转签
  const handleForward = async () => {
    if (!forwardModal || !forwardUserId || !forwardUserName) {
      message.warning('请填写转签目标审批人信息');
      return;
    }
    setForwardLoading(true);
    try {
      await api.forwardExpense(forwardModal.id, { toUserId: forwardUserId, toUserName: forwardUserName, opinion: forwardOpinion });
      message.success('已转签');
      setForwardModal(null);
      setForwardUserId(''); setForwardUserName(''); setForwardOpinion('');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(error?.data?.message || '转签失败');
    } finally { setForwardLoading(false); }
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
    { title: '操作', width: 280, valueType: 'option', fixed: 'right',
      render: (_, r) => (
        <Space>
          {(r.status === 1 || r.status === 2) && <>
            <a onClick={() => { setApprovalModal({ record: r, approve: true }); setApprovalOpinion(''); }}>通过</a>
            <a style={{ color: '#ff4d4f' }} onClick={() => { setApprovalModal({ record: r, approve: false }); setApprovalOpinion(''); }}>驳回</a>
            <a style={{ color: '#722ed1' }} onClick={() => { setForwardModal(r); setForwardUserId(''); setForwardUserName(''); setForwardOpinion(''); }}>
              <SendOutlined /> 转签
            </a>
          </>}
          {r.status === 3 && <Button type="link" size="small" icon={<UploadOutlined />} onClick={() => { setPaymentModal(r); setVoucherUrl(''); }}>确认付款</Button>}
          <a onClick={() => showHistory(r)}><HistoryOutlined /> 审批记录</a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable headerTitle="报销/付款单" actionRef={actionRef} rowKey="id" columns={columns} scroll={{ x: 1400 }}
        request={async (params) => {
          const res = await api.getExpenses({ ...params, page: params.current, pageSize: params.pageSize });
          return { data: res.data?.items || [], total: res.data?.total || 0, success: true };
        }}
        toolBarRender={() => [
          <ImportExport key="ie" exportFn={exportExpenses} onImportSuccess={() => actionRef.current?.reload()} />,
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => { setBudgetWarning(null); setModalVisible(true); }}>提交报销</Button>,
        ]}
      />

      {/* 提交报销单 */}
      <ModalForm title="提交报销/付款单" open={modalVisible} onOpenChange={(v) => { setModalVisible(v); if (!v) setBudgetWarning(null); }} modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            if (values.budgetId) { const ok = await checkBudget(values.budgetId, values.budgetSubject, values.amount); if (!ok) return false; }
            await api.createExpense(values);
            message.success('报销单已提交');
            actionRef.current?.reload();
            return true;
          } catch (error: any) {
            message.error(error?.data?.message || error?.message || '提交失败');
            return false;
          }
        }}>
        {budgetWarning && (
          <Alert type="error" showIcon icon={<ExclamationCircleOutlined />} message="超预算拦截"
            description={<div><p>本次报销金额 <Text strong type="danger">¥{budgetWarning.amount?.toLocaleString()}</Text> 超出预算余额 <Text strong>¥{budgetWarning.remaining?.toLocaleString()}</Text>，超支 <Text strong type="danger">¥{budgetWarning.overage?.toLocaleString()}</Text>。</p><p>请联系总部发起《超预算特批申请》后再提交。</p></div>}
            style={{ marginBottom: 16 }} />
        )}
        <ProFormTreeSelect name="orgId" label="所属分会" rules={[{ required: true, message: '请选择所属分会' }]}
          request={loadOrgTree} fieldProps={{ showSearch: true, treeNodeFilterProp: 'title', placeholder: '请选择所属分会' }} />
        <ProFormSelect name="expenseType" label="类型" rules={[{ required: true, message: '请选择类型' }]} valueEnum={{ REIMBURSE: '报销', PAYMENT: '付款' }} />
        <ProFormDigit name="amount" label="金额(元)" rules={[{ required: true, message: '请输入金额' }]} min={0.01} fieldProps={{ precision: 2, style: { width: '100%' } }} />
        <ProFormText name="budgetId" label="关联预算包ID" tooltip="关联预算包后将进行实时预算余额校验" placeholder="选填，关联后系统将自动扣减预算" />
        <ProFormText name="budgetSubject" label="关联预算科目" placeholder="如：场地费、宣发费等" />
        <ProFormTextArea name="description" label="摘要说明" rules={[{ required: true, message: '请填写摘要' }]} />
      </ModalForm>

      {/* 审批弹窗（含意见） */}
      <Modal
        title={approvalModal?.approve ? '审批通过' : '驳回报销单'}
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
              <Descriptions.Item label="单号">{approvalModal.record.expenseNo}</Descriptions.Item>
              <Descriptions.Item label="金额"><Text strong type="danger">¥{approvalModal.record.amount?.toLocaleString()}</Text></Descriptions.Item>
              <Descriptions.Item label="申请人">{approvalModal.record.applicantName}</Descriptions.Item>
              <Descriptions.Item label="摘要">{approvalModal.record.description}</Descriptions.Item>
            </Descriptions>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>审批意见：</div>
              <TextArea
                rows={3}
                placeholder={approvalModal.approve ? '选填，如：同意报销' : '请填写驳回原因'}
                value={approvalOpinion}
                onChange={(e) => setApprovalOpinion(e.target.value)}
              />
            </div>
          </>
        )}
      </Modal>

      {/* 转签弹窗 */}
      <Modal
        title="转签报销单"
        open={!!forwardModal}
        onCancel={() => setForwardModal(null)}
        onOk={handleForward}
        okText="确认转签"
        okButtonProps={{ loading: forwardLoading }}
        destroyOnClose
      >
        {forwardModal && (
          <>
            <Alert message={`将报销单 ${forwardModal.expenseNo} 转签给其他审批人处理`} type="info" showIcon style={{ marginBottom: 16 }} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 4, fontWeight: 500 }}>选择目标审批人：</div>
              <Select
                showSearch
                placeholder="搜索用户姓名或账号"
                style={{ width: '100%' }}
                filterOption={false}
                onSearch={async (keyword) => {
                  if (!keyword || keyword.length < 1) return;
                  try {
                    const res = await userApi.getUsers({ keyword, pageSize: 20 });
                    const items = res.data?.items || res.data || [];
                    setUserOptions(Array.isArray(items) ? items.map((u: any) => ({
                      label: `${u.realName || u.username} (${u.username})`,
                      value: u.id,
                      user: u,
                    })) : []);
                  } catch { setUserOptions([]); }
                }}
                onChange={(value, option: any) => {
                  setForwardUserId(value as string);
                  setForwardUserName(option?.user?.realName || option?.user?.username || '');
                }}
                options={userOptions}
              />
            </div>
            <div>
              <div style={{ marginBottom: 4, fontWeight: 500 }}>转签说明：</div>
              <TextArea rows={2} placeholder="选填，如：请协助审批此笔报销" value={forwardOpinion} onChange={(e) => setForwardOpinion(e.target.value)} />
            </div>
          </>
        )}
      </Modal>

      {/* 付款确认弹窗 */}
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

      {/* 审批记录抽屉 */}
      <Drawer
        title={<><HistoryOutlined /> 审批记录 — {historyDrawer?.expenseNo}</>}
        open={!!historyDrawer}
        onClose={() => setHistoryDrawer(null)}
        width={480}
      >
        {historyDrawer && (
          <Descriptions size="small" column={1} bordered style={{ marginBottom: 24 }}>
            <Descriptions.Item label="单号">{historyDrawer.expenseNo}</Descriptions.Item>
            <Descriptions.Item label="金额">¥{historyDrawer.amount?.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="申请人">{historyDrawer.applicantName}</Descriptions.Item>
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
export default ExpensePage;
