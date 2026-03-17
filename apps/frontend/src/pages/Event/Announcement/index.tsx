import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Button, Tag, Space, message, Modal, Form, Input, Select, Drawer } from 'antd';
import { PlusOutlined, SendOutlined, BarChartOutlined } from '@ant-design/icons';
import * as api from '@/services/event';
import ReadStats from './ReadStats';

const AnnouncementPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [statsDrawer, setStatsDrawer] = useState<{ visible: boolean; id: string }>({ visible: false, id: '' });
  const [form] = Form.useForm();
  const load = async () => { setLoading(true); const res = await api.getAnnouncements(); setData(res.data || []); setLoading(false); };
  useEffect(() => { load(); }, []);

  const columns = [
    { title: '标题', dataIndex: 'title', width: 250 },
    { title: '类型', dataIndex: 'announcementType', width: 100,
      render: (v: string) => v === 'RED_HEADER' ? <Tag color="red">红头公告</Tag> : v === 'URGENT' ? <Tag color="orange">紧急</Tag> : <Tag>普通</Tag> },
    { title: '发布人', dataIndex: 'publisherName', width: 100 },
    { title: '已读/应读', width: 100, render: (_: any, r: any) => (
      <a onClick={() => setStatsDrawer({ visible: true, id: r.id })}>{r.readCount ?? 0}/{r.totalCount ?? 0}</a>
    )},
    { title: '状态', dataIndex: 'status', width: 80, render: (v: number) => v === 1 ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag> },
    { title: '操作', width: 180, render: (_: any, r: any) => (
      <Space>
        {r.status === 0 && <Button size="small" type="primary" icon={<SendOutlined />}
          onClick={async () => { await api.publishAnnouncement(r.id); message.success('已发布'); load(); }}>发布</Button>}
        <Button size="small" icon={<BarChartOutlined />}
          onClick={() => setStatsDrawer({ visible: true, id: r.id })}>已读统计</Button>
      </Space>
    )},
  ];

  return (
    <PageContainer>
      <Card>
        <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }}
          onClick={() => { form.resetFields(); setModalVisible(true); }}>新建公告</Button>
        <Table rowKey="id" columns={columns} dataSource={data} loading={loading} size="small" />
      </Card>
      <Modal title="新建公告" open={modalVisible} onOk={async () => {
        const values = await form.validateFields();
        await api.createAnnouncement(values); message.success('已创建'); setModalVisible(false); load();
      }} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="announcementType" label="类型" initialValue="NORMAL">
            <Select options={[{ value: 'RED_HEADER', label: '红头公告' }, { value: 'URGENT', label: '紧急' }, { value: 'NORMAL', label: '普通' }]} />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}><Input.TextArea rows={6} /></Form.Item>
        </Form>
      </Modal>

      <Drawer title="已读统计" open={statsDrawer.visible} width={800}
        onClose={() => setStatsDrawer({ visible: false, id: '' })} destroyOnClose>
        {statsDrawer.id && <ReadStats announcementId={statsDrawer.id} />}
      </Drawer>
    </PageContainer>
  );
};
export default AnnouncementPage;
