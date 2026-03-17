import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormDigit, ProFormDatePicker, ProFormSelect, ProFormTreeSelect, ProFormTextArea } from '@ant-design/pro-components';
import { Button, message, Tag, Upload } from 'antd';
import { PlusOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import * as api from '@/services/finance';
import * as orgApi from '@/services/organization';
import ImportExport from '@/components/ImportExport';
import { exportRevenues } from '@/services/export';

const RevenuePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [voucherUrl, setVoucherUrl] = useState<string>('');

  const loadOrgTree = async () => {
    try {
      const res = await orgApi.getOrgTree();
      const transform = (nodes: any[]): any[] =>
        nodes?.map((n) => ({ title: n.name, value: n.id, children: n.children ? transform(n.children) : [] })) || [];
      return transform(res.data || res || []);
    } catch { return []; }
  };

  const columns: ProColumns[] = [
    { title: '收款单号', dataIndex: 'revenueNo', width: 150 },
    { title: '付款方', dataIndex: 'payerName', width: 180 },
    { title: '金额', dataIndex: 'amount', width: 120, valueType: 'money', hideInSearch: true },
    { title: '类型', dataIndex: 'revenueType', width: 100, valueEnum: { SPONSOR: '赞助费', ENTRY_FEE: '报名费', OTHER: '其他' } },
    { title: '应上缴总部', dataIndex: 'hqCommissionAmount', width: 120, valueType: 'money', hideInSearch: true },
    { title: '收款日期', dataIndex: 'revenueDate', valueType: 'date', width: 120, hideInSearch: true },
    { title: '备注', dataIndex: 'description', width: 150, hideInSearch: true, ellipsis: true },
    {
      title: '附件', dataIndex: 'voucherUrl', width: 60, hideInSearch: true,
      render: (_, r) => r.voucherUrl
        ? <a href={r.voucherUrl} target="_blank" rel="noopener noreferrer"><PaperClipOutlined style={{ fontSize: 16, color: '#1890ff' }} /></a>
        : <span style={{ color: '#ccc' }}>-</span>,
    },
    { title: '已结算', dataIndex: 'isSettled', width: 80, hideInSearch: true, render: (_, r) => <Tag color={r.isSettled ? 'green' : 'orange'}>{r.isSettled ? '已结' : '未结'}</Tag> },
    { title: '所属分会', dataIndex: ['organization', 'name'], width: 150, hideInSearch: true },
  ];

  return (
    <PageContainer>
      <ProTable headerTitle="收款登记" actionRef={actionRef} rowKey="id" columns={columns}
        request={async (params) => {
          const res = await api.getRevenues({ ...params, page: params.current, pageSize: params.pageSize });
          return { data: res.data?.items || [], total: res.data?.total || 0, success: true };
        }}
        toolBarRender={() => [
          <ImportExport key="ie" exportFn={exportRevenues} importType="revenues" onImportSuccess={() => actionRef.current?.reload()} />,
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setVoucherUrl(''); setModalVisible(true); }}>录入收款</Button>,
        ]}
      />
      <ModalForm title="录入收款登记单" open={modalVisible} onOpenChange={setModalVisible} modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await api.createRevenue({ ...values, voucherUrl: voucherUrl || undefined });
            message.success('录入成功');
            actionRef.current?.reload();
            return true;
          } catch (error: any) {
            message.error(error?.data?.message || error?.message || '录入失败');
            return false;
          }
        }}>
        <ProFormTreeSelect name="orgId" label="所属分会" rules={[{ required: true, message: '请选择所属分会' }]}
          request={loadOrgTree} fieldProps={{ showSearch: true, treeNodeFilterProp: 'title', placeholder: '请选择所属分会' }} />
        <ProFormText name="payerName" label="付款方名称" rules={[{ required: true }]} />
        <ProFormDigit name="amount" label="收款金额" rules={[{ required: true }]} min={0.01} fieldProps={{ precision: 2 }} />
        <ProFormDatePicker name="revenueDate" label="收款日期" rules={[{ required: true }]} />
        <ProFormSelect name="revenueType" label="收款类型" rules={[{ required: true }]} valueEnum={{ SPONSOR: '赞助费', ENTRY_FEE: '报名费', OTHER: '其他' }} />
        <ProFormTextArea name="description" label="备注说明" placeholder="请输入收款备注，如对应合同号、付款备注等"
          fieldProps={{ rows: 3, maxLength: 500, showCount: true }} />
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>收款凭证附件</div>
          <Upload
            name="file"
            action="/api/v1/upload"
            headers={{ Authorization: 'Bearer ' + localStorage.getItem('accessToken') }}
            accept=".jpg,.jpeg,.png,.pdf,.gif"
            maxCount={1}
            onChange={(info) => {
              if (info.file.status === 'done') {
                const url = info.file.response?.data?.url || info.file.response?.url;
                if (url) {
                  setVoucherUrl(url);
                  message.success('凭证上传成功');
                }
              } else if (info.file.status === 'error') {
                message.error('上传失败');
              }
            }}
          >
            <Button icon={<UploadOutlined />}>上传凭证（图片/PDF）</Button>
          </Upload>
          {voucherUrl && <a href={voucherUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 4, display: 'inline-block' }}>查看已上传凭证</a>}
        </div>
      </ModalForm>
    </PageContainer>
  );
};
export default RevenuePage;
