import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Tree, Button, Space, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Descriptions, Tag, Row, Col, Alert, Typography, Result } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import * as orgApi from '@/services/organization';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const orgTypeMap: Record<number, string> = { 1: '总部', 2: '大区', 3: '省级分会', 4: '市级分会', 5: '区县分会' };

const OrganizationPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const [meltdownVisible, setMeltdownVisible] = useState(false);
  const [meltdownReason, setMeltdownReason] = useState('');
  const [meltdownResult, setMeltdownResult] = useState<any>(null);
  const [meltdownLoading, setMeltdownLoading] = useState(false);
  const access = useAccess();

  const loadTree = async () => {
    const res = await orgApi.getOrgTree();
    setTreeData(res.data || []);
  };

  useEffect(() => { loadTree(); }, []);

  const convertToTreeData = (nodes: any[]): any[] =>
    nodes.map((n) => ({
      title: <span>
        {n.name} <Text type="secondary">({orgTypeMap[n.orgType] || '未知'})</Text>
        {n.status === 0 && <Tag color="red" style={{ marginLeft: 4, fontSize: 11 }}>已停用</Tag>}
      </span>,
      key: n.id,
      data: n,
      disabled: n.status === 0,
      children: n.children ? convertToTreeData(n.children) : [],
    }));

  const handleAdd = (parentId?: string) => {
    setEditing(null); form.resetFields();
    if (parentId) form.setFieldsValue({ parentId });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => { setEditing(record); form.setFieldsValue(record); setModalVisible(true); };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) { await orgApi.updateOrg(editing.id, values); message.success('更新成功'); }
    else { await orgApi.createOrg(values); message.success('创建成功'); }
    setModalVisible(false); loadTree();
  };

  const handleDelete = async (id: string) => {
    await orgApi.deleteOrg(id); message.success('已删除'); setSelected(null); loadTree();
  };

  /** 一键熔断 */
  const handleMeltdown = async () => {
    if (!meltdownReason.trim()) { message.error('请填写熔断原因'); return; }
    setMeltdownLoading(true);
    try {
      const res = await orgApi.meltdownOrg(selected.id, meltdownReason);
      setMeltdownResult(res.data || { frozenOrgCount: 1, frozenUserCount: 0 });
      message.success('熔断执行完成');
      setSelected(null);
      loadTree();
    } catch (err: any) {
      message.error(err?.message || '熔断执行失败');
    } finally {
      setMeltdownLoading(false);
    }
  };

  return (
    <PageContainer>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="组织架构树" extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleAdd()}>新增根节点</Button>}>
            <Tree treeData={convertToTreeData(treeData)} defaultExpandAll
              onSelect={(_, info) => setSelected((info.node as any).data)}
              draggable onDrop={async (info: any) => {
                await orgApi.moveOrg({ nodeId: info.dragNode.key, newParentId: info.node.key });
                message.success('拖拽划转成功'); loadTree();
              }} />
          </Card>
        </Col>
        <Col span={16}>
          <Card title="组织详情" extra={selected && (
            <Space>
              <Button icon={<PlusOutlined />} onClick={() => handleAdd(selected.id)}>添加下级</Button>
              <Button icon={<EditOutlined />} onClick={() => handleEdit(selected)}>编辑</Button>
              {selected.status === 1 && (
                <Button icon={<StopOutlined />} danger type="primary"
                  onClick={() => { setMeltdownVisible(true); setMeltdownReason(''); setMeltdownResult(null); }}>
                  一键熔断
                </Button>
              )}
              <Popconfirm title="确认删除？需先删除所有子组织" onConfirm={() => handleDelete(selected.id)}>
                <Button icon={<DeleteOutlined />} danger>删除</Button>
              </Popconfirm>
            </Space>
          )}>
            {selected ? (
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="名称">{selected.name}</Descriptions.Item>
                <Descriptions.Item label="编码">{selected.code}</Descriptions.Item>
                <Descriptions.Item label="类型">{orgTypeMap[selected.orgType]}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={selected.status === 1 ? 'green' : 'red'}>{selected.status === 1 ? '启用' : '已熔断停用'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="负责人">{selected.leader || '-'}</Descriptions.Item>
                <Descriptions.Item label="电话">{selected.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="地址" span={2}>{selected.address || '-'}</Descriptions.Item>
                <Descriptions.Item label="层级路径" span={2}><Text code>{selected.treePath}</Text></Descriptions.Item>
              </Descriptions>
            ) : <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>请在左侧选择一个组织节点查看详情</div>}
          </Card>
        </Col>
      </Row>

      {/* 新增/编辑组织弹窗 */}
      <Modal title={editing ? '编辑组织' : '新增组织'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="组织名称" rules={[{ required: true, message: '请输入组织名称' }]}><Input /></Form.Item>
          <Form.Item name="code" label="组织编码" rules={[{ required: true, message: '请输入组织编码' }]}><Input disabled={!!editing} /></Form.Item>
          <Form.Item name="orgType" label="组织类型" rules={[{ required: true, message: '请选择组织类型' }]}>
            <Select options={Object.entries(orgTypeMap).map(([k, v]) => ({ value: Number(k), label: v }))} />
          </Form.Item>
          <Form.Item name="parentId" label="父组织ID"><Input disabled /></Form.Item>
          <Form.Item name="leader" label="负责人"><Input placeholder="请输入负责人姓名" /></Form.Item>
          <Form.Item name="phone" label="联系电话"><Input placeholder="请输入联系电话" /></Form.Item>
          <Form.Item name="address" label="地址"><Input placeholder="请输入地址" /></Form.Item>
          <Form.Item name="sortOrder" label="排序号"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      {/* 一键熔断确认弹窗 */}
      <Modal title={<><ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> 一键熔断 — {selected?.name}</>}
        open={meltdownVisible} onCancel={() => setMeltdownVisible(false)}
        footer={meltdownResult ? [<Button key="close" type="primary" onClick={() => setMeltdownVisible(false)}>关闭</Button>] : undefined}
        onOk={handleMeltdown} okText="确认执行熔断" okButtonProps={{ danger: true, loading: meltdownLoading, disabled: !meltdownReason.trim() }}
        destroyOnClose>
        {!meltdownResult ? (
          <>
            <Alert type="error" showIcon message="危险操作警告"
              description={<div><p>此操作将<Text strong type="danger">立即停用</Text>该分会及其下属所有子组织，并强制其所有用户账号失效（瞬间踢下线）。</p><p>历史数据将永久封存在总部，不可逆转。</p></div>}
              style={{ marginBottom: 16 }} />
            <div style={{ marginBottom: 8 }}><Text strong>熔断原因（必填）：</Text></div>
            <TextArea rows={3} placeholder="请详细说明熔断原因，如：严重违规操作、未经授权签约等..." value={meltdownReason} onChange={(e) => setMeltdownReason(e.target.value)} />
          </>
        ) : (
          <Result status="success" title="熔断执行完成"
            subTitle={<div><p>已冻结 <Text strong type="danger">{meltdownResult.frozenOrgCount}</Text> 个组织节点</p><p>已封停 <Text strong type="danger">{meltdownResult.frozenUserCount}</Text> 个用户账号</p></div>} />
        )}
      </Modal>
    </PageContainer>
  );
};

export default OrganizationPage;
