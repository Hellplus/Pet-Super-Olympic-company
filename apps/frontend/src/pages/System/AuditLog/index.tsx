import React, { useRef, useState } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Modal, Descriptions, Tag, Typography, Table } from 'antd';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import * as auditApi from '@/services/auditLog';

const { Text } = Typography;

/** 对比两个快照，返回差异字段列表 */
function diffSnapshots(before: any, after: any) {
  if (!before && !after) return [];
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const diffs: { field: string; before: any; after: any }[] = [];
  allKeys.forEach(key => {
    const bVal = before?.[key];
    const aVal = after?.[key];
    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      diffs.push({ field: key, before: bVal, after: aVal });
    }
  });
  return diffs;
}

function formatVal(v: any) {
  if (v === null || v === undefined) return <Text type="secondary">-</Text>;
  if (typeof v === 'object') return <Text code style={{ fontSize: 12 }}>{JSON.stringify(v)}</Text>;
  return String(v);
}

const AuditLogPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [detail, setDetail] = useState<any>(null);

  const columns: ProColumns[] = [
    { title: '操作人', dataIndex: 'username', width: 100 },
    { title: '姓名', dataIndex: 'realName', width: 80, hideInSearch: true },
    { title: '模块', dataIndex: 'module', width: 120 },
    { title: '操作', dataIndex: 'action', width: 80, valueEnum: { CREATE: '新增', UPDATE: '修改', DELETE: '删除', LOGIN: '登录', LOGOUT: '登出' } },
    { title: '描述', dataIndex: 'description', width: 200, hideInSearch: true, ellipsis: true },
    { title: 'IP', dataIndex: 'ip', width: 130 },
    { title: '结果', dataIndex: 'status', width: 60, hideInSearch: true,
      render: (_, r) => <Tag color={r.status === 1 ? 'green' : 'red'}>{r.status === 1 ? '成功' : '失败'}</Tag> },
    { title: '耗时(ms)', dataIndex: 'duration', width: 80, hideInSearch: true },
    { title: '操作时间', dataIndex: 'createdAt', valueType: 'dateTime', width: 170, hideInSearch: true },
    { title: '操作时间', dataIndex: 'createdAt', valueType: 'dateRange', hideInTable: true,
      search: { transform: (v: any) => ({ startTime: v[0], endTime: v[1] }) } },
    { title: '操作', width: 60, valueType: 'option', render: (_, record) => <a onClick={async () => { const res = await auditApi.getAuditLog(record.id); setDetail(res.data); }}>详情</a> },
  ];

  const diffs = detail ? diffSnapshots(detail.beforeSnapshot, detail.afterSnapshot) : [];

  const diffColumns = [
    { title: '字段', dataIndex: 'field', width: 160, render: (v: string) => <Text strong>{v}</Text> },
    { title: '变更前', dataIndex: 'before', render: (_: any, r: any) => <Text type="danger" delete={r.after !== undefined}>{formatVal(r.before)}</Text> },
    { title: '变更后', dataIndex: 'after', render: (_: any, r: any) => <Text type="success">{formatVal(r.after)}</Text> },
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
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="操作人">{detail.username} ({detail.realName})</Descriptions.Item>
              <Descriptions.Item label="所属组织">{detail.organizationName}</Descriptions.Item>
              <Descriptions.Item label="操作类型">
                <Tag color={detail.action === 'DELETE' ? 'red' : detail.action === 'CREATE' ? 'green' : 'blue'}>
                  {detail.action}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="操作时间">{detail.createdAt}</Descriptions.Item>
              <Descriptions.Item label="IP地址">{detail.ip}</Descriptions.Item>
              <Descriptions.Item label="请求ID">{detail.requestId}</Descriptions.Item>
              <Descriptions.Item label="目标实体">{detail.entityName} / {detail.entityId}</Descriptions.Item>
              <Descriptions.Item label="耗时">{detail.duration}ms</Descriptions.Item>
            </Descriptions>

            {diffs.length > 0 ? (
              <Table dataSource={diffs} columns={diffColumns} rowKey="field"
                size="small" pagination={false} title={() => <Text strong>数据变更对比</Text>} />
            ) : (detail.beforeSnapshot || detail.afterSnapshot) ? (
              <>
                {detail.beforeSnapshot && (
                  <Descriptions bordered size="small" column={1} title="操作前快照" style={{ marginBottom: 12 }}>
                    <Descriptions.Item><pre style={{ maxHeight: 200, overflow: 'auto', fontSize: 12, margin: 0 }}>{JSON.stringify(detail.beforeSnapshot, null, 2)}</pre></Descriptions.Item>
                  </Descriptions>
                )}
                {detail.afterSnapshot && (
                  <Descriptions bordered size="small" column={1} title="操作后快照">
                    <Descriptions.Item><pre style={{ maxHeight: 200, overflow: 'auto', fontSize: 12, margin: 0 }}>{JSON.stringify(detail.afterSnapshot, null, 2)}</pre></Descriptions.Item>
                  </Descriptions>
                )}
              </>
            ) : <Text type="secondary">暂无数据快照</Text>}
          </>
        )}
      </Modal>
    </PageContainer>
  );
};

export default AuditLogPage;
