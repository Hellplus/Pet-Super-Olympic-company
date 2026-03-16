import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormDatePicker, ProFormSelect, ProFormTreeSelect, ProFormDependency } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import * as api from '@/services/branchHr';
import * as orgApi from '@/services/organization';
import ImportExport from '@/components/ImportExport';
import { exportCertificates } from '@/services/export';

const certTypeMap: Record<string, { text: string; color: string }> = {
  expert: { text: '专家证书', color: 'blue' },
  judge: { text: '裁判证书', color: 'purple' },
  committee: { text: '赛组委证书', color: 'cyan' },
  local: { text: '地方证书', color: 'green' },
  other: { text: '其他证书', color: 'default' },
};

const CertificatePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [addVisible, setAddVisible] = useState(false);

  const loadExperts = async () => {
    try {
      const res = await api.getExperts({ pageSize: 200 });
      const items = res.data?.items || [];
      return items.map((e: any) => ({ label: e.name, value: e.id }));
    } catch { return []; }
  };

  const loadOrgTree = async () => {
    try {
      const res = await orgApi.getOrgTree();
      const transform = (nodes: any[]): any[] =>
        nodes?.map((n) => ({ title: n.name, value: n.id, children: n.children ? transform(n.children) : [] })) || [];
      return transform(res.data || res || []);
    } catch { return []; }
  };

  const columns: ProColumns[] = [
    {
      title: '证书类型', dataIndex: 'certType', width: 110,
      valueEnum: { expert: '专家证书', judge: '裁判证书', committee: '赛组委证书', local: '地方证书', other: '其他证书' },
      render: (_, r) => {
        const t = certTypeMap[r.certType] || certTypeMap.other;
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    { title: '证书名称', dataIndex: 'certName', width: 200 },
    { title: '证书编号', dataIndex: 'certNo', width: 150, hideInSearch: true },
    {
      title: '持证人', width: 120, hideInSearch: true,
      render: (_, r) => r.holderName || r.expert?.name || '-',
    },
    { title: '发证机构', dataIndex: 'issuingAuthority', width: 180, hideInSearch: true },
    { title: '颁发日期', dataIndex: 'issueDate', valueType: 'date', width: 120, hideInSearch: true },
    {
      title: '到期日期', dataIndex: 'expiryDate', valueType: 'date', width: 120, hideInSearch: true,
      render: (_, r) => {
        if (!r.expiryDate) return <Tag>永久</Tag>;
        const days = Math.ceil((new Date(r.expiryDate).getTime() - Date.now()) / 86400000);
        if (days < 0) return <Tag color="red">{r.expiryDate}</Tag>;
        if (days < 30) return <Tag color="orange">{r.expiryDate}</Tag>;
        return <Tag color="green">{r.expiryDate}</Tag>;
      },
    },
    {
      title: '状态', dataIndex: 'status', width: 130,
      valueEnum: { all: '全部', valid: '有效', expiring: '即将到期', expired: '已过期' },
      render: (_, r) => {
        if (!r.expiryDate) return <Tag color="blue">永久有效</Tag>;
        const days = Math.ceil((new Date(r.expiryDate).getTime() - Date.now()) / 86400000);
        if (days < 0) return <Tag color="red">已过期 {Math.abs(days)} 天</Tag>;
        if (days < 30) return <Tag color="orange">剩余 {days} 天</Tag>;
        return <Tag color="green">有效</Tag>;
      },
    },
    { title: '关键词', dataIndex: 'keyword', hideInTable: true },
    {
      title: '操作', width: 100, valueType: 'option',
      render: (_, r) => (
        <Space>
          <Popconfirm title="确认删除此证书？" onConfirm={async () => {
            try { await api.deleteCertificate(r.id); message.success('已删除'); actionRef.current?.reload(); }
            catch { message.error('删除失败'); }
          }}>
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable
        headerTitle={<><SafetyCertificateOutlined /> 证书管理</>}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          try {
            const res = await api.getAllCertificates({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.keyword,
              certType: params.certType,
              status: params.status === 'all' ? undefined : params.status,
            });
            const data = res.data || res;
            return { data: data.items || [], total: data.total || 0, success: true };
          } catch { return { data: [], total: 0, success: false }; }
        }}
        toolBarRender={() => [
          <ImportExport key="ie" exportFn={exportCertificates} importType="certificates" onImportSuccess={() => actionRef.current?.reload()} />,
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddVisible(true)}>添加证书</Button>,
        ]}
      />

      <ModalForm title="添加证书" open={addVisible} onOpenChange={setAddVisible}
        modalProps={{ destroyOnClose: true }}
        initialValues={{ certType: 'expert' }}
        onFinish={async (values) => {
          try {
            if (!values.expertId) delete values.expertId;
            if (!values.orgId) delete values.orgId;
            await api.createCertificate(values);
            message.success('证书添加成功');
            actionRef.current?.reload();
            return true;
          } catch (error: any) {
            message.error(error?.data?.message || error?.message || '添加失败');
            return false;
          }
        }}>
        <ProFormSelect name="certType" label="证书类型" rules={[{ required: true, message: '请选择证书类型' }]}
          options={[
            { label: '专家证书', value: 'expert' },
            { label: '裁判证书', value: 'judge' },
            { label: '赛组委证书', value: 'committee' },
            { label: '地方证书', value: 'local' },
            { label: '其他证书', value: 'other' },
          ]} />
        <ProFormText name="holderName" label="持证人姓名" rules={[{ required: true, message: '请输入持证人姓名' }]}
          placeholder="持证人姓名" />
        <ProFormDependency name={['certType']}>
          {({ certType }) => certType === 'expert' ? (
            <ProFormSelect name="expertId" label="关联专家"
              request={loadExperts} fieldProps={{ showSearch: true, allowClear: true, placeholder: '可选：关联到专家库中的专家' }} />
          ) : null}
        </ProFormDependency>
        <ProFormTreeSelect name="orgId" label="所属组织"
          request={loadOrgTree}
          fieldProps={{ showSearch: true, treeNodeFilterProp: 'title', allowClear: true, placeholder: '可选：选择所属组织' }} />
        <ProFormText name="certName" label="证书名称" rules={[{ required: true, message: '请输入证书名称' }]}
          placeholder="如：FCI国际裁判资格证、执业兽医师资格证" />
        <ProFormText name="certNo" label="证书编号" placeholder="证书编号" />
        <ProFormText name="issuingAuthority" label="发证机构" placeholder="如：FCI、AKC、CKU、农业部" />
        <ProFormDatePicker name="issueDate" label="颁发日期" />
        <ProFormDatePicker name="expiryDate" label="到期日期" tooltip="留空表示永久有效" />
        <ProFormText name="fileUrl" label="证书扫描件URL" placeholder="上传后粘贴URL" />
      </ModalForm>
    </PageContainer>
  );
};

export default CertificatePage;
