import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSwitch, ProFormTextArea, ProFormDigit } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message, Space, Popconfirm, Modal, Descriptions, Typography, Tooltip, Badge } from 'antd';
import { PlusOutlined, StarOutlined, StarFilled, EyeOutlined, PhoneOutlined, MailOutlined, EditOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';
import { getClients, createClient, referToHq } from '@/services/sponsorship';

const { Text } = Typography;

const ClientPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [editingClient, setEditingClient] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentClient, setCurrentClient] = useState<any>(null);

  // 更新客户
  const handleUpdate = async (values: any) => {
    try {
      await request(`/sponsorship/clients/${editingClient.id}`, { method: 'PUT', data: values });
      message.success('更新成功');
      actionRef.current?.reload();
      setEditingClient(null);
      return true;
    } catch { message.error('更新失败'); return false; }
  };

  // 引荐总部
  const handleRefer = async (id: string) => {
    try {
      await referToHq(id);
      message.success('已引荐至总部');
      actionRef.current?.reload();
    } catch { message.error('引荐失败'); }
  };

  // 删除客户
  const handleDelete = async (id: string) => {
    try {
      await request(`/sponsorship/clients/${id}`, { method: 'DELETE' });
      message.success('删除成功');
      actionRef.current?.reload();
    } catch { message.error('删除失败，可能已关联合同'); }
  };

  const columns: ProColumns[] = [
    { title: '客户全称', dataIndex: 'clientName', ellipsis: true,
      render: (_, record: any) => (
        <a onClick={() => { setCurrentClient(record); setDetailVisible(true); }}>
          {record.clientName}
        </a>
      ),
    },
    { title: '联系人', dataIndex: 'contactName', width: 100, search: false },
    { title: '联系电话', dataIndex: 'contactPhone', width: 130, search: false,
      render: (v: any) => v ? <><PhoneOutlined /> {v}</> : '-' },
    { title: '邮箱', dataIndex: 'email', width: 160, search: false, ellipsis: true,
      render: (v: any) => v ? <><MailOutlined /> {v}</> : '-' },
    { title: '行业', dataIndex: 'industry', width: 100, search: false,
      render: (v: any) => v ? <Tag>{v}</Tag> : '-' },
    { title: '意向金额', dataIndex: 'intentAmount', width: 130, search: false,
      sorter: true,
      render: (v: any) => {
        const amount = Number(v || 0);
        return <Text strong style={{ color: amount >= 100000 ? '#cf1322' : '#595959' }}>
          ¥{amount.toLocaleString()}
        </Text>;
      },
    },
    { title: '引荐总部', dataIndex: 'referToHq', width: 100,
      valueEnum: { true: { text: '已引荐' }, false: { text: '未引荐' } },
      render: (_, record: any) => record.referToHq
        ? <Badge status="success" text={<><StarFilled style={{ color: '#faad14' }} /> 已引荐</>} />
        : <Badge status="default" text="未引荐" />,
    },
    { title: '录入时间', dataIndex: 'createdAt', width: 160, valueType: 'dateTime', search: false, sorter: true },
    {
      title: '操作', width: 200, search: false,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />}
              onClick={() => { setCurrentClient(record); setDetailVisible(true); }} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => setEditingClient(record)} />
          </Tooltip>
          {!record.referToHq && (
            <Popconfirm title="确认将此客户引荐至总部？" onConfirm={() => handleRefer(record.id)}>
              <Tooltip title="引荐总部">
                <Button type="text" size="small" icon={<StarOutlined style={{ color: '#faad14' }} />} />
              </Tooltip>
            </Popconfirm>
          )}
          <Popconfirm title="确认删除此客户？" onConfirm={() => handleDelete(record.id)}
            okText="删除" okType="danger">
            <Button type="text" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        request={async (params) => {
          try {
            const res = await getClients(params.orgId);
            const list = res?.data || res;
            const arr = Array.isArray(list) ? list : (list?.list || []);
            // 前端搜索过滤
            let filtered = arr;
            if (params.clientName) {
              filtered = filtered.filter((c: any) => c.clientName?.includes(params.clientName));
            }
            if (params.referToHq !== undefined && params.referToHq !== '') {
              const isReferred = params.referToHq === 'true' || params.referToHq === true;
              filtered = filtered.filter((c: any) => !!c.referToHq === isReferred);
            }
            return { data: filtered, success: true, total: filtered.length };
          } catch {
            return { data: [], success: false, total: 0 };
          }
        }}
        toolBarRender={() => [
          <ModalForm
            key="add"
            title="新增客户"
            trigger={<Button type="primary" icon={<PlusOutlined />}>极简录入</Button>}
            onFinish={async (values) => {
              try {
                await createClient(values);
                message.success('客户录入成功');
                actionRef.current?.reload();
                return true;
              } catch { message.error('录入失败'); return false; }
            }}
            modalProps={{ destroyOnClose: true }}
          >
            <ProFormText name="clientName" label="客户全称" rules={[{ required: true, message: '请输入客户名称' }]}
              placeholder="公司/品牌全称" />
            <ProFormText name="contactName" label="联系人" placeholder="主要对接人" />
            <ProFormText name="contactPhone" label="联系电话" placeholder="手机或固话" />
            <ProFormText name="email" label="电子邮箱" placeholder="企业邮箱" />
            <ProFormText name="industry" label="所属行业" placeholder="如：宠物食品、宠物医疗" />
            <ProFormDigit name="intentAmount" label="意向金额(元)" min={0} fieldProps={{ precision: 2 }}
              placeholder="初步意向赞助金额" />
            <ProFormTextArea name="remark" label="备注" placeholder="特殊需求或跟进记录" />
            <ProFormSwitch name="referToHq" label="引荐给总部" tooltip="开启后总部可见此客户信息" />
          </ModalForm>,
        ]}
      />

      {/* 编辑客户 */}
      <ModalForm
        title="编辑客户信息"
        open={!!editingClient}
        onOpenChange={(v) => { if (!v) setEditingClient(null); }}
        initialValues={editingClient}
        onFinish={handleUpdate}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormText name="clientName" label="客户全称" rules={[{ required: true }]} />
        <ProFormText name="contactName" label="联系人" />
        <ProFormText name="contactPhone" label="联系电话" />
        <ProFormText name="email" label="电子邮箱" />
        <ProFormText name="industry" label="所属行业" />
        <ProFormDigit name="intentAmount" label="意向金额(元)" min={0} fieldProps={{ precision: 2 }} />
        <ProFormTextArea name="remark" label="备注" />
        <ProFormSwitch name="referToHq" label="引荐给总部" />
      </ModalForm>

      {/* 客户详情弹窗 */}
      <Modal
        title="客户详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentClient && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="客户全称" span={2}>{currentClient.clientName}</Descriptions.Item>
            <Descriptions.Item label="联系人">{currentClient.contactName || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{currentClient.contactPhone || '-'}</Descriptions.Item>
            <Descriptions.Item label="电子邮箱">{currentClient.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="所属行业">{currentClient.industry || '-'}</Descriptions.Item>
            <Descriptions.Item label="意向金额">¥{Number(currentClient.intentAmount || 0).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="引荐总部">
              {currentClient.referToHq ? <Tag icon={<StarFilled />} color="gold">已引荐</Tag> : <Tag>未引荐</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{currentClient.remark || '-'}</Descriptions.Item>
            <Descriptions.Item label="录入时间" span={2}>{currentClient.createdAt}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
};

export default ClientPage;
