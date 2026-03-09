import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormTextArea } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag, Rate } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
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
      title: '操作', width: 150, valueType: 'option',
      render: (_, r) => (
        <Space>
          <a onClick={() => { setEditing(r); setModalVisible(true); }}>编辑</a>
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
      <ModalForm title={editing ? '编辑专家' : '新增专家'} open={modalVisible} onOpenChange={setModalVisible}
        initialValues={editing || { starLevel: 3 }} modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          if (editing) { await api.updateExpert(editing.id, values); } else { await api.createExpert(values); }
          message.success('操作成功'); actionRef.current?.reload(); return true;
        }}>
        <ProFormText name="name" label="姓名" rules={[{ required: true }]} />
        <ProFormSelect name="expertType" label="专家类型" rules={[{ required: true }]} valueEnum={{ JUDGE: '国际裁判', VET: '权威兽医', BEHAVIOR: '行为专家', OTHER: '其他' }} />
        <ProFormDigit name="starLevel" label="星级" min={1} max={5} />
        <ProFormText name="phone" label="手机号" />
        <ProFormText name="email" label="邮箱" />
        <ProFormText name="nationality" label="国籍" />
        <ProFormTextArea name="bio" label="专业简介" />
      </ModalForm>
    </PageContainer>
  );
};
export default ExpertPage;
