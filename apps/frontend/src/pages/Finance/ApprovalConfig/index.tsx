import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormDigit, ProFormSelect } from '@ant-design/pro-components';
import { Button, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { request } from '@umijs/max';

const ApprovalConfigPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);

  const columns: ProColumns[] = [
    { title: '业务类型', dataIndex: 'bizType', width: 120,
      render: (v: any) => {
        const map: Record<string, string> = { EXPENSE: '报销/付款', BUDGET: '预算审批', CONTRACT: '合同审批' };
        return <Tag color="blue">{map[v as string] || v}</Tag>;
      }
    },
    { title: '最低金额(≥)', dataIndex: 'minAmount', width: 120, valueType: 'money' },
    { title: '最高金额(<)', dataIndex: 'maxAmount', width: 120, render: (v: any) => v ? `¥${Number(v).toLocaleString()}` : '无上限' },
    { title: '审批级别', width: 200, render: (_: any, r: any) => {
      const levels = r.approvalLevels || [];
      return levels.map((l: any, i: number) => <Tag key={i} color={l.level === 'HQ' ? 'red' : 'green'}>{l.name || l.level}</Tag>);
    }},
    { title: '状态', dataIndex: 'status', width: 80, render: (v: any) => v === 1 ? <Tag color="green">启用</Tag> : <Tag>停用</Tag> },
  ];

  return (
    <PageContainer>
      <ProTable headerTitle="审批金额路由配置" actionRef={actionRef} rowKey="id" columns={columns} search={false}
        request={async () => {
          const res = await request('/api/v1/finance/approval-configs');
          return { data: res?.data || res || [], success: true };
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新增规则</Button>,
        ]}
      />
      <ModalForm title="新增审批路由规则" open={modalVisible} onOpenChange={setModalVisible}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          const levels = values.approvalLevel === 'HQ'
            ? [{ level: 'LOCAL', name: '地方初审' }, { level: 'HQ', name: '总部复核' }]
            : [{ level: 'LOCAL', name: '地方终审' }];
          await request('/api/v1/finance/approval-configs', {
            method: 'POST', data: { ...values, approvalLevels: levels, status: 1 },
          });
          message.success('创建成功');
          actionRef.current?.reload();
          return true;
        }}>
        <ProFormSelect name="bizType" label="业务类型" rules={[{ required: true }]}
          valueEnum={{ EXPENSE: '报销/付款', BUDGET: '预算审批' }} />
        <ProFormDigit name="minAmount" label="最低金额(≥)" rules={[{ required: true }]} min={0} fieldProps={{ precision: 2 }} />
        <ProFormDigit name="maxAmount" label="最高金额(<) 留空=无上限" min={0} fieldProps={{ precision: 2 }} />
        <ProFormSelect name="approvalLevel" label="审批级别" rules={[{ required: true }]}
          valueEnum={{ LOCAL: '地方终审(≤阈值)', HQ: '总部加签(≥阈值)' }}
          tooltip="PRD: 单笔<5000元地方会长终审，≥5000元自动加签总部财务复核" />
      </ModalForm>
    </PageContainer>
  );
};
export default ApprovalConfigPage;
