import React, { useRef, useState } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Modal, Descriptions, Tag } from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import * as auditApi from '@/services/auditLog';

const AuditLogPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [detail, setDetail] = useState<any>(null);

  const columns: ProColumns[] = [
    { title: '操作人', dataIndex: 'username', width: 100 },
    { title: '姓名', dataIndex: 'realName', width: 80, hideInSearch: true },
    { title: '模块', dataIndex: 'module', width: 120 },
    { title: '操作', dataIndex: 'action', width: 80, valueEnum: { CREATE: '新增', UPDATE: '修改', DELETE: '删除', LOGIN: '登录', LOGOUT: '登出' } },
    { title: '描述', dataIndex: 'description', width: 200, hideInSearch: true, ellipsis: true },
    { title: 'IP', dataIndex: 'ip', width: 130, hideInSearch: true },
    { title: '结果', dataIndex: 'status', width: 60, render: (_, r) => <Tag color={r.status === 1 ? 'green' : 'red'}>{r.status === 1 ? '成功' : '失败'}</Tag> },
    { title: '耗时(ms)', dataIndex: 'duration', width: 80, hideInSearch: true },
    { title: '操作时间', dataIndex: 'createdAt', valueType: 'dateTime', width: 170, hideInSearch: true },
    { title: '操作时间', dataIndex: 'createdAt', valueType: 'dateRange', hideInTable: true,
      search: { transform: (v: any) => ({ startTime: v[0], endTime: v[1] }) } },
    { title: '操作', width: 60, valueType: 'option', render: (_, record) => <a onClick={async () => { const res = await auditApi.getAuditLog(record.id); setDetail(res.data); }}>详情</a> },
  ];

  return (
    <PageContainer>
      <ProTable headerTitle="审计日志" actionRef={actionRef} rowKey="id" columns={columns} search={{ labelWidth: 'auto' }}
        request={async (params) => {
          const res = await auditApi.getAuditLogs({ ...params, page: params.current, pageSize: params.pageSize });
          return { data: res.data?.items || [], total: res.data?.total || 0, success: true };
        }} />
      <Modal title="审计详情" open={!!detail} onCancel={() => setDetail(null)} width={800} footer={null}>
        {detail && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="操作人">{detail.username} ({detail.realName})</Descriptions.Item>
            <Descriptions.Item label="所属组织">{detail.organizationName}</Descriptions.Item>
            <Descriptions.Item label="操作时间">{detail.createdAt}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{detail.ip}</Descriptions.Item>
            <Descriptions.Item label="请求ID">{detail.requestId}</Descriptions.Item>
            <Descriptions.Item label="User-Agent" span={2}>{detail.userAgent}</Descriptions.Item>
            <Descriptions.Item label="目标实体">{detail.entityName} / {detail.entityId}</Descriptions.Item>
            <Descriptions.Item label="耗时">{detail.duration}ms</Descriptions.Item>
            <Descriptions.Item label="操作前快照" span={2}><pre style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>{JSON.stringify(detail.beforeSnapshot, null, 2)}</pre></Descriptions.Item>
            <Descriptions.Item label="操作后快照" span={2}><pre style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>{JSON.stringify(detail.afterSnapshot, null, 2)}</pre></Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
};

export default AuditLogPage;
