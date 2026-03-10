import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message, Drawer, Table, InputNumber, Form, Space } from 'antd';
import { PlusOutlined, OrderedListOutlined } from '@ant-design/icons';

const SopTemplatePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);

  const columns: ProColumns[] = [
    { title: '模板名称', dataIndex: 'name', ellipsis: true },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
    { title: '任务数', dataIndex: 'taskCount', width: 80, search: false,
      render: (v: any) => <Tag color="blue">{v || 0} 项</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, valueType: 'dateTime', search: false },
    {
      title: '操作', width: 180, search: false,
      render: (_, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<OrderedListOutlined />}
            onClick={() => { setCurrentTemplate(record); setDrawerVisible(true); }}>
            管理任务
          </Button>
          <Button type="link" size="small">编辑</Button>
        </Space>
      ),
    },
  ];

  const taskColumns = [
    { title: '序号', dataIndex: 'sortOrder', width: 60 },
    { title: '任务名称', dataIndex: 'taskName' },
    { title: '开赛前(天)', dataIndex: 'daysBeforeEvent', width: 120,
      render: (v: any) => <Tag color="orange">D-{v}</Tag> },
    { title: '负责角色', dataIndex: 'assigneeRole', width: 120 },
  ];

  return (
    <PageContainer>
      <ProTable
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        request={async () => ({ data: [], success: true, total: 0 })}
        toolBarRender={() => [
          <ModalForm
            key="add"
            title="新建 SOP 模板"
            trigger={<Button type="primary" icon={<PlusOutlined />}>新建模板</Button>}
            onFinish={async (values) => {
              message.success('创建成功');
              actionRef.current?.reload();
              return true;
            }}
          >
            <ProFormText name="name" label="模板名称" rules={[{ required: true }]} />
            <ProFormTextArea name="description" label="描述" />
          </ModalForm>,
        ]}
      />

      <Drawer
        title={`SOP任务管理 - ${currentTemplate?.name || ''}`}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={700}
      >
        <Table
          dataSource={currentTemplate?.tasks || []}
          columns={taskColumns}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: '暂无任务，请添加' }}
        />
        <Button type="dashed" block style={{ marginTop: 16 }} icon={<PlusOutlined />}
          onClick={() => message.info('添加任务功能开发中')}>
          添加任务节点
        </Button>
      </Drawer>
    </PageContainer>
  );
};

export default SopTemplatePage;
