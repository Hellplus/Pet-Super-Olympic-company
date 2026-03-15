import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormTextArea, ProFormDigit, ProFormSelect } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message, Drawer, Table, Space, Popconfirm, Empty, Card, Divider, Alert } from 'antd';
import { PlusOutlined, OrderedListOutlined, DeleteOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';

// 负责角色选项
const roleOptions = [
  { label: '赛事总监', value: '赛事总监' },
  { label: '运营主管', value: '运营主管' },
  { label: '场地经理', value: '场地经理' },
  { label: '裁判组长', value: '裁判组长' },
  { label: '宣传专员', value: '宣传专员' },
  { label: '后勤主管', value: '后勤主管' },
  { label: '财务专员', value: '财务专员' },
  { label: '分会负责人', value: '分会负责人' },
];

const SopTemplatePage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // 加载模板任务
  const loadTemplateTasks = async (template: any) => {
    setCurrentTemplate(template);
    setDrawerVisible(true);
    setTasksLoading(true);
    try {
      const res = await request(`/events/sop-templates/${template.id}`);
      const detail = res?.data || res;
      setTasks(detail?.tasks || []);
    } catch {
      message.error('加载任务列表失败');
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  // 删除模板
  const handleDeleteTemplate = async (id: string) => {
    try {
      await request(`/events/sop-templates/${id}`, { method: 'DELETE' });
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败，可能已被赛事引用');
    }
  };

  // 添加/编辑任务
  const handleSaveTask = async (values: any) => {
    try {
      if (values.id) {
        // 编辑
        await request(`/events/sop-templates/${currentTemplate.id}/tasks/${values.id}`, {
          method: 'PUT', data: values,
        });
        message.success('任务已更新');
      } else {
        // 新增
        await request(`/events/sop-templates/${currentTemplate.id}/tasks`, {
          method: 'POST', data: { ...values, sortOrder: tasks.length + 1 },
        });
        message.success('任务已添加');
      }
      // 刷新任务列表
      loadTemplateTasks(currentTemplate);
      actionRef.current?.reload();
      return true;
    } catch {
      message.error('保存失败');
      return false;
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    try {
      await request(`/events/sop-templates/${currentTemplate.id}/tasks/${taskId}`, { method: 'DELETE' });
      message.success('任务已删除');
      loadTemplateTasks(currentTemplate);
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  // 调整排序
  const handleReorder = async (taskId: string, direction: 'up' | 'down') => {
    const idx = tasks.findIndex((t: any) => t.id === taskId);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === tasks.length - 1)) return;
    const newTasks = [...tasks];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newTasks[idx], newTasks[swapIdx]] = [newTasks[swapIdx], newTasks[idx]];
    const reordered = newTasks.map((t: any, i: number) => ({ ...t, sortOrder: i + 1 }));
    setTasks(reordered);
    try {
      await request(`/events/sop-templates/${currentTemplate.id}/reorder`, {
        method: 'POST', data: { taskIds: reordered.map((t: any) => t.id) },
      });
    } catch { /* 静默处理排序同步失败 */ }
  };

  const columns: ProColumns[] = [
    { title: '模板名称', dataIndex: 'templateName', ellipsis: true },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
    { title: '任务数', dataIndex: 'taskCount', width: 80, search: false,
      render: (v: any) => <Tag color="blue">{v || 0} 项</Tag> },
    { title: '已引用赛事', dataIndex: 'eventCount', width: 100, search: false,
      render: (v: any) => <Tag color={v > 0 ? 'green' : 'default'}>{v || 0} 场</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', width: 160, valueType: 'dateTime', search: false },
    {
      title: '操作', width: 220, search: false,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<OrderedListOutlined />}
            onClick={() => loadTemplateTasks(record)}>
            管理任务
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => setEditingTemplate(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除此模板？" onConfirm={() => handleDeleteTemplate(record.id)}
            okText="删除" okType="danger">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const taskColumns = [
    { title: '序号', dataIndex: 'sortOrder', width: 60, render: (v: any) => <Tag>{v}</Tag> },
    { title: '任务名称', dataIndex: 'taskName', ellipsis: true },
    { title: '开赛前(天)', dataIndex: 'daysBeforeEvent', width: 110,
      render: (v: any) => <Tag color="orange">D-{v}</Tag> },
    { title: '负责角色', dataIndex: 'defaultRole', width: 110,
      render: (v: any) => v ? <Tag color="blue">{v}</Tag> : '-' },
    { title: '说明', dataIndex: 'description', ellipsis: true },
    {
      title: '操作', width: 160,
      render: (_: any, record: any, index: number) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={index === 0}
            onClick={() => handleReorder(record.id, 'up')} />
          <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={index === tasks.length - 1}
            onClick={() => handleReorder(record.id, 'down')} />
          <Popconfirm title="确认删除此任务？" onConfirm={() => handleDeleteTask(record.id)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
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
            const res = await request('/events/sop-templates', { params });
            const list = res?.data || res;
            return { data: Array.isArray(list) ? list : (list?.list || []), success: true, total: list?.total || 0 };
          } catch {
            return { data: [], success: false, total: 0 };
          }
        }}
        toolBarRender={() => [
          <ModalForm
            key="add"
            title="新建 SOP 模板"
            trigger={<Button type="primary" icon={<PlusOutlined />}>新建模板</Button>}
            onFinish={async (values) => {
              try {
                await request('/events/sop-templates', { method: 'POST', data: values });
                message.success('模板创建成功');
                actionRef.current?.reload();
                return true;
              } catch { message.error('创建失败'); return false; }
            }}
            modalProps={{ destroyOnClose: true }}
          >
            <ProFormText name="templateName" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}
              placeholder="如：标准犬类竞技赛 SOP" />
            <ProFormText name="eventType" label="适用赛事类型" placeholder="如：竞技赛、表演赛" />
            <ProFormTextArea name="description" label="模板描述"
              placeholder="描述此模板适用的赛事类型、规模等" />
          </ModalForm>,
        ]}
      />

      {/* 编辑模板 */}
      <ModalForm
        title="编辑模板"
        open={!!editingTemplate}
        onOpenChange={(v) => { if (!v) setEditingTemplate(null); }}
        initialValues={editingTemplate}
        onFinish={async (values) => {
          try {
            await request(`/events/sop-templates/${editingTemplate.id}`, { method: 'PUT', data: values });
            message.success('更新成功');
            actionRef.current?.reload();
            setEditingTemplate(null);
            return true;
          } catch { message.error('更新失败'); return false; }
        }}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormText name="templateName" label="模板名称" rules={[{ required: true }]} />
        <ProFormText name="eventType" label="适用赛事类型" />
        <ProFormTextArea name="description" label="描述" />
      </ModalForm>

      {/* 任务管理抽屉 */}
      <Drawer
        title={`SOP 任务管理 — ${currentTemplate?.templateName || ''}`}
        open={drawerVisible}
        onClose={() => { setDrawerVisible(false); setTasks([]); }}
        width={780}
        extra={
          <ModalForm
            title="添加任务节点"
            trigger={<Button type="primary" icon={<PlusOutlined />} size="small">添加任务</Button>}
            onFinish={handleSaveTask}
            modalProps={{ destroyOnClose: true }}
          >
            <ProFormText name="taskName" label="任务名称" rules={[{ required: true }]}
              placeholder="如：场地布置完成" />
            <ProFormDigit name="daysBeforeEvent" label="开赛前天数 (D-N)" rules={[{ required: true }]}
              min={0} max={365} fieldProps={{ precision: 0 }} placeholder="距比赛开始前多少天完成" />
            <ProFormSelect name="assigneeRole" label="负责角色" rules={[{ required: true }]}
              options={roleOptions} placeholder="选择负责执行的角色" />
            <ProFormTextArea name="description" label="任务说明"
              placeholder="详细描述此任务的执行要求和验收标准" />
          </ModalForm>
        }
      >
        <Alert type="info" showIcon style={{ marginBottom: 16 }}
          message="拖动排序按钮可调整任务执行顺序。任务将按「开赛前天数」倒排为赛事生成 SOP 进度节点。" />
        <Table
          dataSource={tasks}
          columns={taskColumns}
          rowKey="id"
          size="small"
          loading={tasksLoading}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无任务节点，点击右上角「添加任务」开始配置" /> }}
        />
        {tasks.length > 0 && (
          <Card size="small" style={{ marginTop: 16, background: '#fafafa' }}>
            <Space split={<Divider type="vertical" />}>
              <span>共 <b>{tasks.length}</b> 个任务节点</span>
              <span>最早启动：<Tag color="orange">D-{Math.max(...tasks.map((t: any) => t.daysBeforeEvent || 0))}</Tag></span>
              <span>最晚截止：<Tag color="red">D-{Math.min(...tasks.map((t: any) => t.daysBeforeEvent || 0))}</Tag></span>
            </Space>
          </Card>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default SopTemplatePage;
