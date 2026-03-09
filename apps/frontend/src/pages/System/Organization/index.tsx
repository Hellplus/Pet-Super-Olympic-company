import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Tree, Button, Space, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Descriptions, Tag, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined } from '@ant-design/icons';
import * as orgApi from '@/services/organization';

const orgTypeMap: Record<number, string> = { 1: '总部', 2: '大区', 3: '省级分会', 4: '市级分会', 5: '区县分会' };

const OrganizationPage: React.FC = () => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const loadTree = async () => {
    const res = await orgApi.getOrgTree();
    setTreeData(res.data || []);
  };

  useEffect(() => { loadTree(); }, []);

  const convertToTreeData = (nodes: any[]): any[] =>
    nodes.map((n) => ({ title: n.name + ' (' + (orgTypeMap[n.orgType] || '未知') + ')', key: n.id, data: n, children: n.children ? convertToTreeData(n.children) : [] }));

  const handleAdd = (parentId?: string) => {
    setEditing(null);
    form.resetFields();
    if (parentId) form.setFieldsValue({ parentId });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await orgApi.updateOrg(editing.id, values);
      message.success('更新成功');
    } else {
      await orgApi.createOrg(values);
      message.success('创建成功');
    }
    setModalVisible(false);
    loadTree();
  };

  const handleDelete = async (id: string) => {
    await orgApi.deleteOrg(id);
    message.success('已删除');
    setSelected(null);
    loadTree();
  };

  const handleDisable = async (id: string) => {
    await orgApi.disableOrg(id);
    message.success('已熔断停用');
    loadTree();
  };

  return (
    <PageContainer>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="组织架构树" extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleAdd()}>新增根节点</Button>}>
            <Tree
              treeData={convertToTreeData(treeData)}
              defaultExpandAll
              onSelect={(_, info) => setSelected((info.node as any).data)}
              draggable
              onDrop={async (info: any) => {
                await orgApi.moveOrg({ nodeId: info.dragNode.key, newParentId: info.node.key });
                message.success('拖拽划转成功');
                loadTree();
              }}
            />
          </Card>
        </Col>
        <Col span={16}>
          <Card title="组织详情" extra={selected && (
            <Space>
              <Button icon={<PlusOutlined />} onClick={() => handleAdd(selected.id)}>添加下级</Button>
              <Button icon={<EditOutlined />} onClick={() => handleEdit(selected)}>编辑</Button>
              <Popconfirm title="确认熔断停用该分会？" onConfirm={() => handleDisable(selected.id)}>
                <Button icon={<StopOutlined />} danger>一键熔断</Button>
              </Popconfirm>
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
                <Descriptions.Item label="状态"><Tag color={selected.status === 1 ? 'green' : 'red'}>{selected.status === 1 ? '启用' : '停用'}</Tag></Descriptions.Item>
                <Descriptions.Item label="负责人">{selected.leader || '-'}</Descriptions.Item>
                <Descriptions.Item label="电话">{selected.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="地址" span={2}>{selected.address || '-'}</Descriptions.Item>
                <Descriptions.Item label="层级路径" span={2}>{selected.treePath}</Descriptions.Item>
              </Descriptions>
            ) : <p>请在左侧选择一个组织节点</p>}
          </Card>
        </Col>
      </Row>
      <Modal title={editing ? '编辑组织' : '新增组织'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="组织名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="组织编码" rules={[{ required: true }]}><Input disabled={!!editing} /></Form.Item>
          <Form.Item name="orgType" label="组织类型" rules={[{ required: true }]}>
            <Select options={Object.entries(orgTypeMap).map(([k, v]) => ({ value: Number(k), label: v }))} />
          </Form.Item>
          <Form.Item name="parentId" label="父组织ID"><Input disabled /></Form.Item>
          <Form.Item name="leader" label="负责人"><Input /></Form.Item>
          <Form.Item name="phone" label="联系电话"><Input /></Form.Item>
          <Form.Item name="address" label="地址"><Input /></Form.Item>
          <Form.Item name="sortOrder" label="排序号"><InputNumber min={0} /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default OrganizationPage;
