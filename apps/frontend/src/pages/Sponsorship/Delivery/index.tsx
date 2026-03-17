import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormDigit, ProFormSelect } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Tag, Space, message, Modal, Image, Descriptions, Progress } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import FileUpload from '../../../components/FileUpload';
import * as api from '@/services/sponsorship';

const DeliveryPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<string | undefined>();

  const statusMap: Record<number, { color: string; text: string }> = {
    0: { color: 'default', text: '待执行' },
    1: { color: 'processing', text: '执行中' },
    2: { color: 'success', text: '已完成' },
  };

  // 加载合同列表
  const loadContracts = async () => {
    try {
      const res = await api.getContracts({ status: 1, pageSize: 200 });
      const items = res.data?.items || res.data || [];
      setContracts(Array.isArray(items) ? items : []);
    } catch { setContracts([]); }
  };

  React.useEffect(() => { loadContracts(); }, []);

  const columns: ProColumns[] = [
    { title: '任务名称', dataIndex: 'taskName', ellipsis: true },
    { title: '任务类型', dataIndex: 'taskType', width: 100,
      render: (v: any) => <Tag>{v}</Tag> },
    { title: '要求数量', dataIndex: 'quantity', width: 80 },
    { title: '完成数量', dataIndex: 'completedQuantity', width: 80 },
    { title: '进度', key: 'progress', width: 120,
      render: (_, r: any) => {
        const pct = r.quantity > 0 ? Math.round((r.completedQuantity || 0) / r.quantity * 100) : 0;
        return <Progress percent={pct} size="small" status={pct >= 100 ? 'success' : 'active'} />;
      }},
    { title: '状态', dataIndex: 'status', width: 80,
      render: (v: any) => {
        const s = statusMap[v] || { color: 'default', text: v };
        return <Tag color={s.color}>{s.text}</Tag>;
      }},
    { title: '证据照片', key: 'photos', width: 100,
      render: (_, r: any) => {
        const count = r.evidencePhotos?.length || 0;
        return count > 0
          ? <Button type="link" size="small" onClick={() => { setSelectedPhotos(r.evidencePhotos); setPhotoModalOpen(true); }}>{count} 张</Button>
          : <Tag>无</Tag>;
      }},
    {
      title: '操作', width: 150,
      render: (_, record: any) => (
        <Space>
          {record.status !== 2 && (
            <Button type="primary" size="small" icon={<CameraOutlined />}
              onClick={() => { setCurrentTask(record); setEvidenceModalOpen(true); }}>
              提交证据
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8, fontWeight: 500 }}>选择合同：</span>
        <ProFormSelect
          fieldProps={{
            style: { width: 360 },
            value: selectedContract,
            onChange: (v: any) => { setSelectedContract(v); actionRef.current?.reload(); },
            allowClear: true,
            showSearch: true,
            placeholder: '请选择合同查看交付任务',
            options: contracts.map((c: any) => ({
              label: `${c.contractNo || ''} - ${c.clientName || c.sponsorName || ''}`,
              value: c.id,
            })),
          }}
          noStyle
        />
      </div>
      <ProTable
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        search={false}
        request={async () => {
          if (!selectedContract) return { data: [], success: true, total: 0 };
          try {
            const res = await api.getDeliveryTasks(selectedContract);
            const list = res?.data || res || [];
            return { data: Array.isArray(list) ? list : [], success: true, total: Array.isArray(list) ? list.length : 0 };
          } catch { return { data: [], success: true, total: 0 }; }
        }}
        headerTitle="权益交付任务"
        locale={{ emptyText: selectedContract ? '该合同暂无交付任务' : '请先选择一个合同' }}
      />

      {/* 提交证据弹窗 */}
      <ModalForm
        title={`提交证据 - ${currentTask?.taskName || ''}`}
        open={evidenceModalOpen}
        onOpenChange={setEvidenceModalOpen}
        onFinish={async (values) => {
          try {
            await api.submitEvidence(currentTask.id, values);
            message.success('证据提交成功');
            actionRef.current?.reload();
            return true;
          } catch (error: any) {
            message.error(error?.data?.message || '提交失败');
            return false;
          }
        }}
      >
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="任务">{currentTask?.taskName}</Descriptions.Item>
          <Descriptions.Item label="要求数量">{currentTask?.quantity}</Descriptions.Item>
        </Descriptions>
        <ProFormDigit name="completedQuantity" label="本次完成数量" min={1} rules={[{ required: true }]} />
        <div style={{ marginBottom: 8, fontWeight: 'bold' }}>现场拍照（强制摄像头，禁止相册，自动叠加水印）</div>
        <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>
          水印包含：拍摄时间 + GPS经纬度 + 赛事名称 + 拍摄人
        </div>
        <FileUpload bizType="delivery_evidence" bizId={currentTask?.id}
          accept="image/*" maxCount={20} listType="picture-card" />
      </ModalForm>

      {/* 照片查看弹窗 */}
      <Modal title="证据照片" open={photoModalOpen}
        onCancel={() => setPhotoModalOpen(false)} footer={null} width={800}>
        <Image.PreviewGroup>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selectedPhotos.map((p: any, i: number) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <Image src={p.url || p} width={150} height={150} style={{ objectFit: 'cover' }} />
                {p.capturedAt && <div style={{ fontSize: 11, color: '#999' }}>{p.capturedAt}</div>}
                {p.longitude && <div style={{ fontSize: 11, color: '#999' }}>{p.latitude},{p.longitude}</div>}
              </div>
            ))}
          </div>
        </Image.PreviewGroup>
      </Modal>
    </PageContainer>
  );
};

export default DeliveryPage;
