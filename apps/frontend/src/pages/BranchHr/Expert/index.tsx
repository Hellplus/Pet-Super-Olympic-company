import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormTextArea, ProFormDatePicker } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag, Rate, Modal, Table, Empty } from 'antd';
import { PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import * as api from '@/services/branchHr';

const typeMap: Record<string, { text: string; color: string }> = {
  JUDGE: { text: '国际裁判', color: 'blue' }, VET: { text: '权威兽医', color: 'green' },
  BEHAVIOR: { text: '行为专家', color: 'purple' }, OTHER: { text: '其他', color: 'default' },
};

const ExpertPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  // 证书管理
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [certExpert, setCertExpert] = useState<any>(null);
  const [certs, setCerts] = useState<any[]>([]);
  const [certLoading, setCertLoading] = useState(false);
  const [addCertVisible, setAddCertVisible] = useState(false);

  const loadCerts = async (expertId: string) => {
    setCertLoading(true);
    try {
      const res = await api.getExpertCertificates(expertId);
      setCerts(res.data || res || []);
    } catch { setCerts([]); }
    finally { setCertLoading(false); }
  };

  const openCertModal = (expert: any) => {
    setCertExpert(expert);
    setCertModalVisible(true);
    loadCerts(expert.id);
  };

  const certColumns = [
    { title: '证书名称', dataIndex: 'certName', key: 'certName' },
    { title: '证书编号', dataIndex: 'certNo', key: 'certNo', render: (v: any) => v || '-' },
    { title: '发证机构', dataIndex: 'issuingAuthority', key: 'issuingAuthority', render: (v: any) => v || '-' },
    { title: '到期日期', dataIndex: 'expiryDate', key: 'expiryDate',
      render: (v: any) => {
        if (!v) return '-';
        const isExpired = new Date(v) < new Date();
        return <Tag color={isExpired ? 'red' : 'green'}>{v}</Tag>;
      },
    },
    { title: '状态', key: 'status',
      render: (_: any, r: any) => {
        if (!r.expiryDate) return <Tag>永久有效</Tag>;
        const days = Math.ceil((new Date(r.expiryDate).getTime() - Date.now()) / 86400000);
        if (days < 0) return <Tag color="red">已过期 {Math.abs(days)} 天</Tag>;
        if (days < 30) return <Tag color="orange">剩余 {days} 天</Tag>;
        return <Tag color="green">有效</Tag>;
      },
    },
  ];

  const columns: ProColumns[] = [
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '类型', dataIndex: 'expertType', width: 100,
      render: (_, r) => { const t = typeMap[r.expertType]; return t ? <Tag color={t.color}>{t.text}</Tag> : r.expertType; },
      valueEnum: { JUDGE: '国际裁判', VET: '权威兽医', BEHAVIOR: '行为专家', OTHER: '其他' },
    },
    { title: '星级', dataIndex: 'starLevel', width: 150, hideInSearch: true, render: (_, r) => <Rate disabled value={r.starLevel} count={5} style={{ fontSize: 14 }} /> },
    { title: '国籍', dataIndex: 'nationality', width: 100, hideInSearch: true },
    { title: '手机', dataIndex: 'phone', width: 130, hideInSearch: true },
    { title: '状态', dataIndex: 'status', width: 80, hideInSearch: true, render: (_, r) => <Tag color={r.status === 1 ? 'green' : 'red'}>{r.status === 1 ? '在库' : '停用'}</Tag> },
    {
      title: '操作', width: 220, valueType: 'option',
      render: (_, r) => (
        <Space>
          <a onClick={() => { setEditing(r); setModalVisible(true); }}>编辑</a>
          <a onClick={() => openCertModal(r)}><SafetyCertificateOutlined /> 证书</a>
          <Popconfirm title="确认删除?" onConfirm={async () => { await api.deleteExpert(r.id); message.success('已删除'); actionRef.current?.reload(); }}>
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable headerTitle="专业人才库" actionRef={actionRef} rowKey="id" columns={columns}
        request={async (params) => {
          const res = await api.getExperts({ ...params, page: params.current, pageSize: params.pageSize });
          return { data: res.data?.items || [], total: res.data?.total || 0, success: true };
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalVisible(true); }}>新增专家</Button>,
        ]}
      />

      {/* 新增/编辑专家 */}
      <ModalForm title={editing ? '编辑专家' : '新增专家'} open={modalVisible} onOpenChange={setModalVisible}
        initialValues={editing || { starLevel: 3 }} modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            if (editing) { await api.updateExpert(editing.id, values); } else { await api.createExpert(values); }
            message.success('操作成功'); actionRef.current?.reload(); return true;
          } catch (error: any) {
            message.error(error?.data?.message || error?.message || '操作失败');
            return false;
          }
        }}>
        <ProFormText name="name" label="姓名" rules={[{ required: true }]} />
        <ProFormSelect name="expertType" label="专家类型" rules={[{ required: true }]} valueEnum={{ JUDGE: '国际裁判', VET: '权威兽医', BEHAVIOR: '行为专家', OTHER: '其他' }} />
        <ProFormDigit name="starLevel" label="星级" min={1} max={5} />
        <ProFormText name="phone" label="手机号" />
        <ProFormText name="email" label="邮箱" />
        <ProFormText name="nationality" label="国籍" />
        <ProFormTextArea name="bio" label="专业简介" />
      </ModalForm>

      {/* 证书管理弹窗 */}
      <Modal title={<><SafetyCertificateOutlined /> {certExpert?.name} — 证书管理</>}
        open={certModalVisible} onCancel={() => setCertModalVisible(false)} footer={null}
        width={800} destroyOnClose>
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddCertVisible(true)}>添加证书</Button>
        </div>
        <Table dataSource={certs} columns={certColumns} rowKey="id" loading={certLoading}
          pagination={false} size="small"
          locale={{ emptyText: <Empty description="暂无证书，请点击上方按钮添加" /> }} />
      </Modal>

      {/* 添加证书表单 */}
      <ModalForm title="添加证书" open={addCertVisible} onOpenChange={setAddCertVisible}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await api.addCertificate(certExpert.id, values);
            message.success('证书添加成功');
            loadCerts(certExpert.id);
            return true;
          } catch (error: any) {
            message.error(error?.data?.message || error?.message || '添加失败');
            return false;
          }
        }}>
        <ProFormText name="certName" label="证书名称" rules={[{ required: true, message: '请输入证书名称' }]} placeholder="如：FCI国际裁判资格证" />
        <ProFormText name="certNo" label="证书编号" placeholder="证书编号" />
        <ProFormText name="issuingAuthority" label="发证机构" placeholder="如：FCI、AKC、CKU" />
        <ProFormDatePicker name="issueDate" label="颁发日期" />
        <ProFormDatePicker name="expiryDate" label="到期日期" />
        <ProFormText name="fileUrl" label="证书扫描件URL" placeholder="上传后粘贴URL" />
      </ModalForm>
    </PageContainer>
  );
};
export default ExpertPage;
