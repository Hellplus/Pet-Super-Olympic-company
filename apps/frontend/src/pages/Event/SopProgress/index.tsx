import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Tag, Progress, Badge, Row, Col, Statistic, Alert, Drawer, Button, Space, Select, Modal, Form, Input, DatePicker, message, Popconfirm } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, UnorderedListOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';
import * as eventApi from '@/services/event';
import * as userApi from '@/services/user';

const lightConfig: Record<string, { color: string; text: string; icon: any }> = {
  green: { color: '#52c41a', text: '正常', icon: <CheckCircleOutlined /> },
  yellow: { color: '#faad14', text: '预警', icon: <ClockCircleOutlined /> },
  red: { color: '#f5222d', text: '延期', icon: <CloseCircleOutlined /> },
};

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待开始', color: 'default' },
  1: { text: '进行中', color: 'processing' },
  2: { text: '已完成', color: 'success' },
  3: { text: '已延期', color: 'error' },
  9: { text: '已取消', color: 'default' },
};

const SopProgressPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 任务详情 Drawer
  const [taskDrawer, setTaskDrawer] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<any[]>([]);

  // 添加子任务
  const [subtaskModal, setSubtaskModal] = useState(false);
  const [parentTask, setParentTask] = useState<any>(null);
  const [subtaskForm] = Form.useForm();

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = () => {
    setLoading(true);
    request('/api/v1/events/sop-progress-matrix').then((res: any) => {
      setData(res?.data || res || []);
    }).finally(() => setLoading(false));
  };

  const loadTasks = async (eventId: string) => {
    setTasksLoading(true);
    try {
      const res = await eventApi.getEventTasks(eventId);
      setTasks(res?.data || res || []);
    } catch { setTasks([]); }
    setTasksLoading(false);
  };

  const loadUsers = async (keyword: string) => {
    if (!keyword || keyword.length < 1) return;
    try {
      const res = await userApi.getUsers({ realName: keyword, pageSize: 20 });
      const items = res?.data?.items || [];
      setUserOptions(items.map((u: any) => ({ label: `${u.realName} (${u.username})`, value: u.id, name: u.realName })));
    } catch {}
  };

  const handleAssign = async (taskId: string, userId: string, userName: string) => {
    try {
      await eventApi.assignTask(taskId, { assigneeId: userId, assigneeName: userName });
      message.success('已指派');
      if (currentEvent) loadTasks(currentEvent.eventId);
    } catch { message.error('指派失败'); }
  };

  const handleAddSubtask = async () => {
    try {
      const values = await subtaskForm.validateFields();
      await eventApi.createSubtask(parentTask.id, {
        taskName: values.taskName,
        deadline: values.deadline?.format('YYYY-MM-DD'),
        assigneeId: values.assigneeId,
        assigneeName: userOptions.find((u: any) => u.value === values.assigneeId)?.name || '',
      });
      message.success('子任务已添加');
      subtaskForm.resetFields();
      setSubtaskModal(false);
      if (currentEvent) loadTasks(currentEvent.eventId);
    } catch {}
  };

  const handleStatusChange = async (taskId: string, status: number) => {
    try {
      await eventApi.updateTaskStatus(taskId, { status });
      message.success('状态已更新');
      if (currentEvent) loadTasks(currentEvent.eventId);
      loadMatrix();
    } catch { message.error('更新失败'); }
  };

  const redCount = data.filter(d => d.light === 'red').length;
  const yellowCount = data.filter(d => d.light === 'yellow').length;
  const greenCount = data.filter(d => d.light === 'green').length;

  const matrixColumns = [
    { title: '信号灯', dataIndex: 'light', width: 80,
      render: (v: string) => {
        const cfg = lightConfig[v] || lightConfig.green;
        return <Badge color={cfg.color} text={<Tag color={cfg.color}>{cfg.text}</Tag>} />;
      },
      filters: [
        { text: '延期(红)', value: 'red' },
        { text: '预警(黄)', value: 'yellow' },
        { text: '正常(绿)', value: 'green' },
      ],
      onFilter: (v: any, r: any) => r.light === v,
    },
    { title: '赛事名称', dataIndex: 'eventName', width: 200 },
    { title: '承办分会', dataIndex: 'orgName', width: 150 },
    { title: '开赛日期', dataIndex: 'eventDate', width: 120 },
    { title: '进度', dataIndex: 'progress', width: 150,
      render: (v: number) => <Progress percent={v} size="small" status={v >= 100 ? 'success' : 'active'} /> },
    { title: '总任务', dataIndex: 'total', width: 80 },
    { title: '已完成', dataIndex: 'completed', width: 80 },
    { title: '逾期', dataIndex: 'overdue', width: 80,
      render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : <Tag color="green">0</Tag> },
    { title: '操作', width: 100,
      render: (_: any, record: any) => (
        <Button type="link" icon={<UnorderedListOutlined />} onClick={() => {
          setCurrentEvent(record);
          setTaskDrawer(true);
          loadTasks(record.eventId);
        }}>任务详情</Button>
      ),
    },
  ];

  // 任务树表格列
  const taskColumns = [
    { title: '任务名称', dataIndex: 'taskName', width: 200 },
    { title: '截止日期', dataIndex: 'deadline', width: 110 },
    { title: '状态', dataIndex: 'status', width: 100,
      render: (v: number, record: any) => {
        const isOverdue = v !== 2 && v !== 9 && new Date(record.deadline) < new Date();
        return (
          <Select size="small" value={v} style={{ width: 90 }}
            onChange={(newStatus: number) => handleStatusChange(record.id, newStatus)}>
            <Select.Option value={0}><Tag>待开始</Tag></Select.Option>
            <Select.Option value={1}><Tag color="processing">进行中</Tag></Select.Option>
            <Select.Option value={2}><Tag color="success">已完成</Tag></Select.Option>
            <Select.Option value={9}><Tag>已取消</Tag></Select.Option>
          </Select>
        );
      },
    },
    { title: '负责人', dataIndex: 'assigneeName', width: 160,
      render: (v: string, record: any) => (
        <Select
          size="small"
          showSearch
          placeholder="指派负责人"
          value={v || undefined}
          style={{ width: 140 }}
          filterOption={false}
          onSearch={loadUsers}
          options={userOptions}
          onChange={(userId: string) => {
            const user = userOptions.find((u: any) => u.value === userId);
            handleAssign(record.id, userId, user?.name || '');
          }}
        />
      ),
    },
    { title: '操作', width: 100,
      render: (_: any, record: any) => (
        <Space>
          {!record.parentTaskId && (
            <Button type="link" size="small" icon={<PlusOutlined />}
              onClick={() => { setParentTask(record); setSubtaskModal(true); }}>
              子任务
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      {redCount > 0 && (
        <Alert type="error" message={`有 ${redCount} 场赛事SOP存在延期任务，请立即督办！`}
          showIcon style={{ marginBottom: 16 }} />
      )}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card><Statistic title="正常(绿灯)" value={greenCount} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="预警(黄灯)" value={yellowCount} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="延期(红灯)" value={redCount} valueStyle={{ color: '#f5222d' }} /></Card>
        </Col>
      </Row>
      <Card>
        <Table rowKey="eventId" columns={matrixColumns} dataSource={data} loading={loading}
          size="middle" pagination={false} />
      </Card>

      {/* 任务详情 Drawer */}
      <Drawer
        title={<>{currentEvent?.eventName} <Tag color="blue">任务管理</Tag></>}
        open={taskDrawer}
        onClose={() => { setTaskDrawer(false); setCurrentEvent(null); setTasks([]); }}
        width={850}
        destroyOnClose
      >
        <Table
          rowKey="id"
          columns={taskColumns}
          dataSource={tasks}
          loading={tasksLoading}
          size="small"
          pagination={false}
          expandable={{ childrenColumnName: 'children' }}
          rowClassName={(record: any) => {
            if (record.status === 2) return '';
            if (record.status !== 9 && new Date(record.deadline) < new Date()) return 'ant-table-row-overdue';
            return '';
          }}
        />
      </Drawer>

      {/* 添加子任务 Modal */}
      <Modal title={`添加子任务 — ${parentTask?.taskName || ''}`} open={subtaskModal}
        onCancel={() => { setSubtaskModal(false); setParentTask(null); subtaskForm.resetFields(); }}
        onOk={handleAddSubtask} destroyOnClose>
        <Form form={subtaskForm} layout="vertical">
          <Form.Item name="taskName" label="子任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="如：舞台灯光调试" />
          </Form.Item>
          <Form.Item name="deadline" label="截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="assigneeId" label="指派负责人">
            <Select showSearch placeholder="搜索姓名指派" filterOption={false} onSearch={loadUsers}
              options={userOptions} allowClear />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};
export default SopProgressPage;
