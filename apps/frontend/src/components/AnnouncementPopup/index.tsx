import React, { useEffect, useState } from 'react';
import { Modal, List, Tag, Button, Typography, Badge, message } from 'antd';
import { NotificationOutlined, AlertOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';

const { Title, Paragraph } = Typography;

const typeColor: Record<string, string> = {
  RED_HEADER: 'red', URGENT: 'orange', NORMAL: 'blue',
};
const typeLabel: Record<string, string> = {
  RED_HEADER: '红头公告', URGENT: '紧急通知', NORMAL: '普通公告',
};

const AnnouncementPopup: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ipoc_access_token');
    if (!token) return;
    request('/api/v1/events/my-unread-announcements').then((res: any) => {
      const data = res?.data || res || {};
      if (data.unreadCount > 0) {
        setAnnouncements(data.announcements || []);
        setVisible(true);
      }
    }).catch(() => {});
  }, []);

  const markRead = async (id: string) => {
    await request(`/api/v1/events/announcements/${id}/mark-read`, { method: 'POST' });
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    if (announcements.length <= 1) {
      setVisible(false);
      setDetailVisible(false);
    }
  };

  const showDetail = (item: any) => {
    setCurrent(item);
    setDetailVisible(true);
  };

  return (
    <>
      <Modal
        title={<><NotificationOutlined /> 您有 {announcements.length} 条未读公告</>}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={[
          <Button key="close" onClick={() => setVisible(false)}>稍后再看</Button>,
          <Button key="readAll" type="primary" onClick={async () => {
            for (const a of announcements) { await markRead(a.id); }
            message.success('已全部标记已读');
          }}>全部已读</Button>,
        ]}
        width={600}
      >
        <List
          dataSource={announcements}
          renderItem={(item: any) => (
            <List.Item
              actions={[
                <a onClick={() => showDetail(item)}>查看</a>,
                <a onClick={() => markRead(item.id)}>已读</a>,
              ]}
            >
              <List.Item.Meta
                avatar={<Badge dot><AlertOutlined style={{ fontSize: 20 }} /></Badge>}
                title={<>
                  <Tag color={typeColor[item.announcementType]}>{typeLabel[item.announcementType] || '公告'}</Tag>
                  {item.title}
                </>}
                description={`${item.publisherName || ''} · ${item.publishedAt ? new Date(item.publishedAt).toLocaleString('zh-CN') : ''}`}
              />
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title={current?.title}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="read" type="primary" onClick={() => { markRead(current?.id); setDetailVisible(false); }}>
            确认已读
          </Button>,
        ]}
        width={700}
      >
        {current && (
          <div>
            <Tag color={typeColor[current.announcementType]}>{typeLabel[current.announcementType]}</Tag>
            <span style={{ color: '#999', marginLeft: 8 }}>{current.publisherName} · {current.publishedAt ? new Date(current.publishedAt).toLocaleString('zh-CN') : ''}</span>
            <div style={{ marginTop: 16, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{current.content}</div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AnnouncementPopup;
