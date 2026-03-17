import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSwitch, ProFormTextArea, ProFormDigit, ProFormTreeSelect } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message, Space, Popconfirm, Modal, Descriptions, Typography, Tooltip, Badge, Drawer, Timeline, Form, Input, Select, DatePicker, Divider, Empty } from 'antd';
import { PlusOutlined, StarOutlined, StarFilled, EyeOutlined, PhoneOutlined, MailOutlined, EditOutlined, HistoryOutlined, DeleteOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';
import { getClients, createClient, referToHq, getFollowUps, createFollowUp, deleteFollowUp } from '@/services/sponsorship';
import * as orgApi from '@/services/organization';
import ImportExport from '@/components/ImportExport';
import { exportClients } from '@/services/export';

const { Text } = Typography;
const { TextArea } = Input;

const contactTypeMap: Record<string, { label: string; color: string }> = {
  phone: { label: '电话', color: 'blue' },
  visit: { label: '拜访', color: 'green' },
  email: { label: '邮件', color: 'purple' },
  wechat: { label: '微信', color: 'cyan' },
  other: { label: '其他', color: 'default' },
};

const ClientPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [editingClient, setEditingClient] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentClient, setCurrentClient] = useState<any>(null);

  // 跟进记录
  const [followUpVisible, setFollowUpVisible] = useState(false);
  const [followUpClient, setFollowUpClient] = useState<any>(null);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpForm] = Form.useForm();

  const loadFollowUps = async (clientId: string) => {
    setFollowUpLoading(true);
    try {
      const res = await getFollowUps(clientId);
      setFollowUps(res?.data || res || []);
    } catch { setFollowUps([]); }
    setFollowUpLoading(false);
  };

  const handleOpenFollowUp = (record: any) => {
    setFollowUpClient(record);
    setFollowUpVisible(true);
    loadFollowUps(record.id);
  };

  const handleAddFollowUp = async () => {
    try {
      const values = await followUpForm.validateFields();
      await createFollowUp(followUpClient.id, {
        contactType: values.contactType,
        content: values.content,
        nextFollowDate: values.nextFollowDate?.format('YYYY-MM-DD'),
      });
      message.success('跟进记录已添加');
      followUpForm.resetFields();
      loadFollowUps(followUpClient.id);
    } catch {}
  };

  const handleDeleteFollowUp = async (id: string) => {
    try {
      await deleteFollowUp(id);
      message.success('已删除');
      loadFollowUps(followUpClient.id);
    } catch { message.error('删除失败'); }
  };

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

  const handleRefer = async (id: string) => {
    try { await referToHq(id); message.success('已引荐至总部'); actionRef.current?.reload(); }
    catch { message.error('引荐失败'); }
  };

  const handleDelete = async (id: string) => {
    try { await request(`/sponsorship/clients/${id}`, { method: 'DELETE' }); message.success('删除成功'); actionRef.current?.reload(); }
    catch { message.error('删除失败，可能已关联合同'); }
  };

  const columns: ProColumns[] = [
    { title: '客户全称', dataIndex: 'companyName', ellipsis: true,
      render: (_, record: any) => (
        <a onClick={() => { setCurrentClient(record); setDetailVisible(true); }}>{record.companyName}</a>
      ),
    },
    { title: '联系人', dataIndex: 'contactPerson', width: 100, search: false },
    { title: '联系电话', dataIndex: 'contactPhone', width: 130, search: false,
      render: (v: any) => v ? <><PhoneOutlined /> {v}</> : '-' },
    { title: '邮箱', dataIndex: 'email', width: 160, search: false, ellipsis: true,
      render: (v: any) => v ? <><MailOutlined /> {v}</> : '-' },
    { title: '行业/品类', dataIndex: 'category', width: 100, search: false,
      render: (v: any) => v ? <Tag>{v}</Tag> : '-' },
    { title: '意向金额', dataIndex: 'intendedAmount', width: 130, search: false, sorter: true,
      render: (v: any) => {
        const amount = Number(v || 0);
        return <Text strong style={{ color: amount >= 100000 ? '#cf1322' : '#595959' }}>¥{amount.toLocaleString()}</Text>;
      },
    },
    { title: '引荐总部', dataIndex: 'isReferredToHq', width: 100,
      valueEnum: { true: { text: '已引荐' }, false: { text: '未引荐' } },
      render: (_, record: any) => record.isReferredToHq
        ? <Badge status="success" text={<><StarFilled style={{ color: '#faad14' }} /> 已引荐</>} />
        : <Badge status="default" text="未引荐" />,
    },
    { title: '录入时间', dataIndex: 'createdAt', width: 160, valueType: 'dateTime', search: false, sorter: true },
    {
      title: '操作', width: 240, search: false,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="跟进记录">
            <Button type="text" size="small" icon={<HistoryOutlined style={{ color: '#1890ff' }} />}
              onClick={() => handleOpenFollowUp(record)} />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />}
              onClick={() => { setCurrentClient(record); setDetailVisible(true); }} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => setEditingClient(record)} />
          </Tooltip>
          {!record.isReferredToHq && (
            <Popconfirm title="确认将此客户引荐至总部？" onConfirm={() => handleRefer(record.id)}>
              <Tooltip title="引荐总部">
                <Button type="text" size="small" icon={<StarOutlined style={{ color: '#faad14' }} />} />
              </Tooltip>
            </Popconfirm>
          )}
          <Popconfirm title="确认删除此客户？" onConfirm={() => handleDelete(record.id)} okText="删除" okType="danger">
            <Button type="text" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable
        columns={columns} actionRef={actionRef} rowKey="id" search={{ labelWidth: 'auto' }}
        request={async (params) => {
          try {
            const res = await getClients(params.orgId);
            const list = res?.data || res;
            const arr = Array.isArray(list) ? list : (list?.list || []);
            let filtered = arr;
            if (params.companyName) filtered = filtered.filter((c: any) => c.companyName?.includes(params.companyName));
            if (params.isReferredToHq !== undefined && params.isReferredToHq !== '') {
              const isReferred = params.isReferredToHq === 'true' || params.isReferredToHq === true;
              filtered = filtered.filter((c: any) => !!c.isReferredToHq === isReferred);
            }
            return { data: filtered, success: true, total: filtered.length };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        toolBarRender={() => [
          <ImportExport key="ie" exportFn={exportClients} onImportSuccess={() => actionRef.current?.reload()} />,
          <ModalForm key="add" title="新增客户"
            trigger={<Button type="primary" icon={<PlusOutlined />}>极简录入</Button>}
            onFinish={async (values) => {
              try { await createClient(values); message.success('客户录入成功'); actionRef.current?.reload(); return true; }
              catch { message.error('录入失败'); return false; }
            }}
            modalProps={{ destroyOnClose: true }}>
            <ProFormTreeSelect name="orgId" label="所属分会" rules={[{ required: true, message: '请选择所属分会' }]}
              request={async () => {
                try {
                  const res = await orgApi.getOrgTree();
                  const transform = (nodes: any[]): any[] =>
                    nodes?.map((n) => ({ title: n.name, value: n.id, children: n.children ? transform(n.children) : [] })) || [];
                  return transform(res.data || res || []);
                } catch { return []; }
              }}
              fieldProps={{ showSearch: true, treeNodeFilterProp: 'title', placeholder: '请选择所属分会' }} />
            <ProFormText name="companyName" label="客户全称" rules={[{ required: true, message: '请输入客户名称' }]} placeholder="公司/品牌全称" />
            <ProFormText name="contactPerson" label="联系人" placeholder="主要对接人" />
            <ProFormText name="contactPhone" label="联系电话" placeholder="手机或固话"
              rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }]} />
            <ProFormText name="email" label="电子邮箱" placeholder="企业邮箱"
              rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]} />
            <ProFormText name="category" label="所属品类" placeholder="如：宠物食品、宠物医疗" />
            <ProFormDigit name="intendedAmount" label="意向金额(元)" min={0} fieldProps={{ precision: 2 }} placeholder="初步意向赞助金额" />
            <ProFormTextArea name="remark" label="备注" placeholder="特殊需求或跟进记录" />
            <ProFormSwitch name="isReferredToHq" label="引荐给总部" tooltip="开启后总部可见此客户信息" />
          </ModalForm>,
        ]}
      />

      {/* 编辑客户 */}
      <ModalForm title="编辑客户信息" open={!!editingClient} onOpenChange={(v) => { if (!v) setEditingClient(null); }}
        initialValues={editingClient} onFinish={handleUpdate} modalProps={{ destroyOnClose: true }}>
        <ProFormText name="companyName" label="客户全称" rules={[{ required: true }]} />
        <ProFormText name="contactPerson" label="联系人" />
        <ProFormText name="contactPhone" label="联系电话" rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }]} />
        <ProFormText name="email" label="电子邮箱" rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]} />
        <ProFormText name="category" label="所属品类" />
        <ProFormDigit name="intendedAmount" label="意向金额(元)" min={0} fieldProps={{ precision: 2 }} />
        <ProFormTextArea name="remark" label="备注" />
        <ProFormSwitch name="isReferredToHq" label="引荐给总部" />
      </ModalForm>

      {/* 客户详情弹窗 */}
      <Modal title="客户详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={600}>
        {currentClient && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="客户全称" span={2}>{currentClient.companyName}</Descriptions.Item>
            <Descriptions.Item label="联系人">{currentClient.contactPerson || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{currentClient.contactPhone || '-'}</Descriptions.Item>
            <Descriptions.Item label="电子邮箱">{currentClient.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="所属品类">{currentClient.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="意向金额">¥{Number(currentClient.intendedAmount || 0).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="引荐总部">
              {currentClient.isReferredToHq ? <Tag icon={<StarFilled />} color="gold">已引荐</Tag> : <Tag>未引荐</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{currentClient.remark || '-'}</Descriptions.Item>
            <Descriptions.Item label="录入时间" span={2}>{currentClient.createdAt}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 跟进记录 Drawer */}
      <Drawer
        title={<>{followUpClient?.companyName} <Tag color="blue">跟进记录</Tag></>}
        open={followUpVisible}
        onClose={() => { setFollowUpVisible(false); setFollowUpClient(null); setFollowUps([]); followUpForm.resetFields(); }}
        width={520}
        destroyOnClose
      >
        {/* 添加跟进记录表单 */}
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <Text strong style={{ marginBottom: 12, display: 'block' }}>添加跟进记录</Text>
          <Form form={followUpForm} layout="vertical" size="small">
            <Form.Item name="contactType" label="跟进方式" rules={[{ required: true, message: '请选择跟进方式' }]}>
              <Select placeholder="请选择">
                <Select.Option value="phone">电话沟通</Select.Option>
                <Select.Option value="visit">上门拜访</Select.Option>
                <Select.Option value="email">邮件往来</Select.Option>
                <Select.Option value="wechat">微信沟通</Select.Option>
                <Select.Option value="other">其他方式</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="content" label="跟进内容" rules={[{ required: true, message: '请输入跟进内容' }]}>
              <TextArea rows={3} placeholder="本次沟通的要点、客户反馈、下一步计划..." maxLength={500} showCount />
            </Form.Item>
            <Form.Item name="nextFollowDate" label="下次跟进日期">
              <DatePicker style={{ width: '100%' }} placeholder="计划下次跟进的日期" />
            </Form.Item>
            <Button type="primary" onClick={handleAddFollowUp} block>提交跟进记录</Button>
          </Form>
        </div>

        <Divider>历史跟进记录 ({followUps.length})</Divider>

        {followUps.length === 0 ? (
          <Empty description="暂无跟进记录" />
        ) : (
          <Timeline
            items={followUps.map((f: any) => {
              const cfg = contactTypeMap[f.contactType] || { label: f.contactType, color: 'default' };
              return {
                key: f.id,
                color: cfg.color === 'blue' ? 'blue' : cfg.color === 'green' ? 'green' : 'gray',
                children: (
                  <div style={{ position: 'relative' }}>
                    <div style={{ marginBottom: 4 }}>
                      <Tag color={cfg.color}>{cfg.label}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {f.createdAt ? new Date(f.createdAt).toLocaleString('zh-CN') : ''}
                      </Text>
                      <Popconfirm title="删除此记录？" onConfirm={() => handleDeleteFollowUp(f.id)}>
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ float: 'right' }} />
                      </Popconfirm>
                    </div>
                    <div style={{ marginBottom: 4 }}>{f.content}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {f.creatorName && <span>记录人: {f.creatorName}</span>}
                      {f.nextFollowDate && <span style={{ marginLeft: 12 }}>下次跟进: {f.nextFollowDate}</span>}
                    </div>
                  </div>
                ),
              };
            })}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default ClientPage;
