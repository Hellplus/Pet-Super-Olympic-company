import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Space, Divider, message, Table, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import * as api from '@/services/sponsorship';

interface Props {
  contractId: string;
  contractNo: string;
  rightsDesc?: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const taskTypes = [
  { value: 'BOARD', label: 'A字板/展板' },
  { value: 'BANNER', label: '横幅/条幅' },
  { value: 'BROADCAST', label: '口播/播报' },
  { value: 'BOOTH', label: '展位/展台' },
  { value: 'LOGO', label: 'LOGO展示' },
  { value: 'GIFT', label: '赠品发放' },
  { value: 'ACTIVITY', label: '互动环节' },
  { value: 'OTHER', label: '其他权益' },
];

const RightsDecompose: React.FC<Props> = ({ contractId, contractNo, rightsDesc, visible, onClose, onSuccess }) => {
  const [tasks, setTasks] = useState<any[]>([{ taskName: '', taskType: 'BOARD', quantity: 1 }]);
  const [loading, setLoading] = useState(false);

  const addTask = () => setTasks([...tasks, { taskName: '', taskType: 'OTHER', quantity: 1 }]);

  const removeTask = (idx: number) => setTasks(tasks.filter((_, i) => i !== idx));

  const updateTask = (idx: number, field: string, value: any) => {
    const newTasks = [...tasks];
    newTasks[idx] = { ...newTasks[idx], [field]: value };
    setTasks(newTasks);
  };

  const submit = async () => {
    const validTasks = tasks.filter(t => t.taskName && t.quantity > 0);
    if (validTasks.length === 0) { message.warning('请至少添加一个权益任务'); return; }
    setLoading(true);
    try {
      await api.decomposeRights(contractId, validTasks);
      message.success(`已拆解 ${validTasks.length} 个交付任务`);
      onSuccess();
      onClose();
    } catch (e: any) {
      message.error(e?.message || '拆包失败');
    }
    setLoading(false);
  };

  return (
    <Modal
      title={<><ThunderboltOutlined /> 权益智能拆包 - {contractNo}</>}
      open={visible}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={loading}
      width={700}
      okText="确认拆包下发"
    >
      {rightsDesc && (
        <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, marginBottom: 16 }}>
          <strong>合同权益描述：</strong>{rightsDesc}
        </div>
      )}
      <Divider orientation="left">拆解为交付任务</Divider>
      {tasks.map((t, i) => (
        <Space key={i} style={{ display: 'flex', marginBottom: 8 }} align="start">
          <Input placeholder="任务名称(如: 主舞台A字板)" value={t.taskName}
            onChange={e => updateTask(i, 'taskName', e.target.value)} style={{ width: 200 }} />
          <Select value={t.taskType} onChange={v => updateTask(i, 'taskType', v)}
            options={taskTypes} style={{ width: 130 }} />
          <InputNumber value={t.quantity} onChange={v => updateTask(i, 'quantity', v || 1)}
            min={1} addonAfter="个" style={{ width: 100 }} />
          {tasks.length > 1 && <Button icon={<DeleteOutlined />} danger onClick={() => removeTask(i)} />}
        </Space>
      ))}
      <Button type="dashed" onClick={addTask} icon={<PlusOutlined />} block style={{ marginTop: 8 }}>
        添加权益项
      </Button>
    </Modal>
  );
};

export default RightsDecompose;
