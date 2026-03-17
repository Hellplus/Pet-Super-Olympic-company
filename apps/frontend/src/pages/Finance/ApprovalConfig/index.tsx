import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormDigit, ProFormSelect, ProFormGroup } from '@ant-design/pro-components';
import { Button, message, Tag, Popconfirm, Switch, Space, Alert, Card, Descriptions, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { request } from '@umijs/max';

const { Text } = Typography;

const bizTypeMap: Record<string, { label: string; color: string }> = {
  EXPENSE: { label: '报销/付款', color: 'orange' },
  BUDGET: { label: '预算审批', color: 'blue' },
  CONTRACT: { label: '合同审批', color: 'green' },
};

const approvalLevelOptions = [
  { value: 'LOCAL', label: '地方终审 — 地方会长直接审批通过' },
  { value: 'HQ', label: '总部加签 — 地方初审 → 总部财务复核' },
  { value: 'HQ_ONLY', label: '总部直审 — 仅总部审批' },
];

const ApprovalConfigPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const handleToggle = async (id: string) => {
    try {
      await request(`/finance/approval-configs/${id}/toggle`, { method: 'PUT' });
      message.success('状态已切换');
      actionRef.current?.reload();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await request(`/finance/approval-configs/${id}/delete`, { method: 'POST' });
      message.success('已删除');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ProColumns[] = [
    {
      title: '业务类型', dataIndex: 'bizType', width: 120,
      render: (_, r: any) => {
        const cfg = bizTypeMap[r.bizType] || { label: r.bizType, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '金额区间', width: 200,
      render: (_, r: any) => {
        const min = Number(r.minAmount || 0);
        const max = r.maxAmount ? Number(r.maxAmount) : null;
        return (
          <Text strong>
            ¥{min.toLocaleString()}
            {' — '}
            {max ? `¥${max.toLocaleString()}` : <Tag color="red">无上限</Tag>}
          </Text>
        );
      },
    },
    {
      title: '审批级别', width: 250,
      render: (_: any, r: any) => {
        const levels = r.approvalLevels || [];
        if (levels.length === 0) return <Tag>未配置</Tag>;
        return (
          <Space>
            {levels.map((l: any, i: number) => (
              <React.Fragment key={i}>
                <Tag color={l.level === 'HQ' ? 'red' : l.level === 'HQ_ONLY' ? 'volcano' : 'green'}>
                  {l.name || l.level}
                </Tag>
                {i < levels.length - 1 && <span style={{ color: '#999' }}>→</span>}
              </React.Fragment>
            ))}
          </Space>
        );
      },
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (_, r: any) => (
        <Switch
          checked={r.status === 1}
          checkedChildren="启用"
          unCheckedChildren="停用"
          onChange={() => handleToggle(r.id)}
        />
      ),
    },
    {
      title: '操作', width: 120, valueType: 'option',
      render: (_, r: any) => [
        <a key="edit" onClick={() => { setEditing(r); setModalVisible(true); }}>
          <EditOutlined /> 编辑
        </a>,
        <Popconfirm key="del" title="确定删除此规则？" onConfirm={() => handleDelete(r.id)}>
          <a style={{ color: '#ff4d4f' }}><DeleteOutlined /> 删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <Alert
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
        message="审批金额路由规则说明"
        description={
          <div>
            <p>• 系统根据报销/预算金额自动匹配审批规则，决定审批流程级别</p>
            <p>• <Tag color="green">地方终审</Tag>：地方会长/主管直接终审，无需总部介入</p>
            <p>• <Tag color="red">总部加签</Tag>：地方初审通过后，自动流转到总部财务复核（两级审批）</p>
            <p>• <Tag color="volcano">总部直审</Tag>：仅总部审批，适用于大额或特殊审批</p>
            <p>• 金额未匹配任何规则时，默认走地方终审流程</p>
            <p>• <strong>推荐配置</strong>：单笔 &lt; ¥5,000 地方终审，¥5,000 ~ ¥50,000 总部加签，≥ ¥50,000 总部直审</p>
          </div>
        }
      />

      <ProTable
        headerTitle="审批金额路由配置"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        pagination={false}
        request={async () => {
          const res = await request('/finance/approval-configs');
          return { data: res?.data || res || [], success: true };
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalVisible(true); }}>
            新增规则
          </Button>,
        ]}
      />

      <ModalForm
        title={editing ? '编辑审批路由规则' : '新增审批路由规则'}
        open={modalVisible}
        onOpenChange={(v) => { setModalVisible(v); if (!v) setEditing(null); }}
        modalProps={{ destroyOnClose: true, width: 560 }}
        initialValues={editing ? {
          bizType: editing.bizType,
          minAmount: Number(editing.minAmount),
          maxAmount: editing.maxAmount ? Number(editing.maxAmount) : undefined,
          approvalLevel: (editing.approvalLevels as any)?.[0]?.level === 'HQ'
            ? (editing.approvalLevels?.length > 1 ? 'HQ' : 'HQ_ONLY')
            : 'LOCAL',
        } : { minAmount: 0 }}
        onFinish={async (values) => {
          let levels: any[];
          switch (values.approvalLevel) {
            case 'HQ':
              levels = [
                { level: 'LOCAL', name: '地方初审' },
                { level: 'HQ', name: '总部复核' },
              ];
              break;
            case 'HQ_ONLY':
              levels = [{ level: 'HQ', name: '总部直审' }];
              break;
            default:
              levels = [{ level: 'LOCAL', name: '地方终审' }];
          }
          const payload = {
            ...(editing?.id ? { id: editing.id } : {}),
            bizType: values.bizType,
            minAmount: values.minAmount,
            maxAmount: values.maxAmount || null,
            approvalLevels: levels,
            status: editing ? editing.status : 1,
          };
          await request('/finance/approval-configs', { method: 'POST', data: payload });
          message.success(editing ? '更新成功' : '创建成功');
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormSelect
          name="bizType"
          label="业务类型"
          rules={[{ required: true, message: '请选择业务类型' }]}
          options={[
            { value: 'EXPENSE', label: '报销/付款' },
            { value: 'BUDGET', label: '预算审批' },
            { value: 'CONTRACT', label: '合同审批' },
          ]}
          disabled={!!editing}
          tooltip="业务类型创建后不可修改"
        />
        <ProFormGroup>
          <ProFormDigit
            name="minAmount"
            label="最低金额(≥)"
            rules={[{ required: true, message: '请输入最低金额' }]}
            min={0}
            fieldProps={{ precision: 2, prefix: '¥', style: { width: 180 } }}
          />
          <ProFormDigit
            name="maxAmount"
            label="最高金额(<)"
            min={0}
            fieldProps={{ precision: 2, prefix: '¥', style: { width: 180 } }}
            tooltip="留空表示无上限"
          />
        </ProFormGroup>
        <ProFormSelect
          name="approvalLevel"
          label="审批级别"
          rules={[{ required: true, message: '请选择审批级别' }]}
          options={approvalLevelOptions}
          tooltip="PRD: 单笔<5000元地方会长终审，≥5000元自动加签总部财务复核"
        />
      </ModalForm>

      {/* 底部规则测试工具 */}
      <Card title="🔍 规则测试工具" size="small" style={{ marginTop: 16 }}>
        <ApprovalRouteTest />
      </Card>
    </PageContainer>
  );
};

/** 审批路由测试组件 */
const ApprovalRouteTest: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <ProFormSelect
          name="testBizType"
          noStyle
          fieldProps={{
            placeholder: '业务类型',
            style: { width: 140 },
            onChange: () => setResult(null),
            id: 'test-biz-type',
          }}
          options={[
            { value: 'EXPENSE', label: '报销/付款' },
            { value: 'BUDGET', label: '预算审批' },
          ]}
        />
        <ProFormDigit
          name="testAmount"
          noStyle
          fieldProps={{
            placeholder: '测试金额',
            prefix: '¥',
            style: { width: 160 },
            id: 'test-amount',
          }}
        />
        <Button
          type="primary"
          size="small"
          loading={testing}
          onClick={async () => {
            const bizType = (document.getElementById('test-biz-type') as any)?.value ||
              document.querySelector<HTMLInputElement>('[id="test-biz-type"]')?.closest('.ant-select')?.querySelector('.ant-select-selection-item')?.getAttribute('title');
            const amountEl = document.getElementById('test-amount') as HTMLInputElement;
            const amount = amountEl?.value;
            if (!bizType || !amount) {
              message.warning('请输入业务类型和金额');
              return;
            }
            setTesting(true);
            try {
              const res = await request('/finance/approval-route', { params: { bizType, amount } });
              setResult(res?.data || res);
            } catch {
              message.error('查询失败');
            }
            setTesting(false);
          }}
        >
          测试匹配
        </Button>
      </Space>
      {result && (
        <Descriptions size="small" bordered column={1} style={{ maxWidth: 500 }}>
          <Descriptions.Item label="匹配结果">
            <Tag color={result.approvalLevel === 'HQ' ? 'red' : result.approvalLevel === 'HQ_ONLY' ? 'volcano' : 'green'}>
              {result.approvalLevel === 'HQ' ? '总部加签' : result.approvalLevel === 'HQ_ONLY' ? '总部直审' : '地方终审'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="说明">{result.description}</Descriptions.Item>
          {result.approvalLevels && (
            <Descriptions.Item label="审批流程">
              {(result.approvalLevels || []).map((l: any, i: number) => (
                <React.Fragment key={i}>
                  <Tag color={l.level === 'HQ' ? 'red' : 'green'}>{l.name}</Tag>
                  {i < result.approvalLevels.length - 1 && ' → '}
                </React.Fragment>
              ))}
            </Descriptions.Item>
          )}
        </Descriptions>
      )}
    </div>
  );
};

export default ApprovalConfigPage;
