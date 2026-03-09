import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormDatePicker, ProFormSelect, ProFormDigit } from '@ant-design/pro-components';
import { Button, message, Tag, Space, Progress } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import * as api from '@/services/event';

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '筹备中', color: 'processing' }, 1: { text: '进行中', color: 'orange' },
  2: { text: '已完赛', color: 'green' }, 3: { text: '已结案', color: 'default' }, 9: { text: '已取消', color: 'red' },
};

const EventListPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);

  const columns: ProColumns[] = [
    { title: '赛事编号', dataIndex: 'eventCode', width: 140 },
    { title: '赛事名称', dataIndex: 'eventName', width: 200 },
    { title: '分会', dataIndex: ['organization', 'name'], width: 150, hideInSearch: true },
    { title: '类型', dataIndex: 'eventType', width: 100 },
    { title: '开赛日', dataIndex: 'eventDate', valueType: 'date', width: 110, hideInSearch: true },
    { title: 'SOP进度', dataIndex: 'overallProgress', width: 150, hideInSearch: true,
      render: (_, r) => <Progress percent={r.overallProgress || 0} size="small" status={r.overallProgress >= 100 ? 'success' : 'active'} /> },
    { title: '状态', dataIndex: 'status', width: 90,
      render: (_, r) => { const s = statusMap[r.status]; return <Tag color={s?.color}>{s?.text}</Tag>; },
      valueEnum: { 0: '筹备中', 1: '进行中', 2: '已完赛', 9: '已取消' },
    },
    {
      title: '操作', width: 100, valueType: 'option',
      render: (_, r) => <a onClick={async () => { const res = await api.getEvent(r.id); message.info('赛事任务数: ' + (res.data?.tasks?.length || 0)); }}>详情</a>,
    },
  ];

  return (
    <PageContainer>
      <ProTable headerTitle="赛事列表" actionRef={actionRef} rowKey="id" columns={columns}
        request={async (params) => {
          const res = await api.getEvents({ ...params, page: params.current, pageSize: params.pageSize });
          return { data: res.data?.items || [], total: res.data?.total || 0, success: true };
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>创建赛事</Button>,
        ]}
      />
      <ModalForm title="创建赛事" open={modalVisible} onOpenChange={setModalVisible} modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => { await api.createEvent(values); message.success('创建成功'); actionRef.current?.reload(); return true; }}>
        <ProFormText name="eventName" label="赛事名称" rules={[{ required: true }]} />
        <ProFormText name="orgId" label="举办分会ID" rules={[{ required: true }]} />
        <ProFormDatePicker name="eventDate" label="开赛日期" rules={[{ required: true }]} />
        <ProFormText name="eventType" label="赛事类型" rules={[{ required: true }]} />
        <ProFormText name="venue" label="举办地点" />
        <ProFormDigit name="expectedParticipants" label="预计参赛数" min={0} />
        <ProFormText name="sopTemplateId" label="SOP模板ID(可选,自动派发任务)" />
      </ModalForm>
    </PageContainer>
  );
};
export default EventListPage;
