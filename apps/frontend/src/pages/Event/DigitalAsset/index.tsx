import React, { useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Tag, Space, message, Popconfirm, Modal, Watermark, Image, Alert, Typography } from 'antd';
import { PlusOutlined, DownloadOutlined, CloudUploadOutlined, EyeOutlined, SafetyOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import { queryFiles, deleteFile } from '../../../services/upload';

const { Text } = Typography;

const DigitalAssetPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const { initialState } = useModel('@@initialState');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  const currentUser = initialState?.currentUser;
  const watermarkText = currentUser
    ? `${currentUser.realName || currentUser.username} ${new Date().toLocaleDateString()}`
    : 'IPOC内部文件';

  /** 带水印预览 */
  const handlePreview = (record: any) => {
    setPreviewFile(record);
    setPreviewVisible(true);
  };

  /** 带水印下载（追加水印参数） */
  const handleDownload = (record: any) => {
    const params = new URLSearchParams({
      watermark: '1',
      user: currentUser?.realName || 'unknown',
      phone: currentUser?.phone?.slice(-4) || '0000',
    });
    window.open(`/api/v1/upload/${record.id}/download?${params.toString()}`, '_blank');
    message.success('下载已开始，文件已叠加防泄密水印');
  };

  const isImage = (ext: string) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext?.toLowerCase());

  const columns: ProColumns[] = [
    { title: '文件名', dataIndex: 'originalName', ellipsis: true, width: 250 },
    { title: '类型', dataIndex: 'fileExt', width: 80,
      render: (v: any) => <Tag>{String(v).toUpperCase()}</Tag> },
    { title: '大小', dataIndex: 'fileSize', width: 100, search: false,
      render: (v: any) => {
        const kb = Number(v) / 1024;
        return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
      }},
    { title: '业务类型', dataIndex: 'bizType', width: 120 },
    { title: '访问级别', dataIndex: 'accessLevel', width: 100,
      render: (v: any) => {
        const map: Record<string, string> = { public: '公开', private: '私有', internal: '内部' };
        return <Tag color={v === 'private' ? 'red' : v === 'internal' ? 'orange' : 'green'}>{map[v as string] || v}</Tag>;
      }},
    { title: '下载次数', dataIndex: 'downloadCount', width: 80, search: false },
    { title: '上传时间', dataIndex: 'createdAt', width: 160, valueType: 'dateTime', search: false },
    {
      title: '操作', width: 200, search: false, fixed: 'right',
      render: (_, record: any) => (
        <Space>
          {isImage(record.fileExt) && (
            <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handlePreview(record)}>
              预览
            </Button>
          )}
          <Button type="link" icon={<DownloadOutlined />} size="small" onClick={() => handleDownload(record)}>
            下载
          </Button>
          <Popconfirm title="确认删除?" onConfirm={async () => {
            await deleteFile(record.id);
            message.success('删除成功');
            actionRef.current?.reload();
          }}>
            <Button type="link" danger size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <Alert
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        message="IP 数字资产防泄密保护已启用"
        description="预览和下载文件时，系统将自动叠加包含您姓名、手机尾号和时间的防泄密追踪水印。"
        style={{ marginBottom: 16 }}
        closable
      />
      <ProTable
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1200 }}
        search={{ labelWidth: 'auto' }}
        request={async (params) => {
          const res = await queryFiles(params);
          const list = res?.data || res || [];
          return { data: Array.isArray(list) ? list : [], success: true };
        }}
        toolBarRender={() => [
          <Button key="upload" type="primary" icon={<CloudUploadOutlined />}
            onClick={() => message.info('请使用各业务模块内的上传功能')}>
            IP资产上传
          </Button>,
        ]}
      />

      {/* 防泄密水印预览弹窗 */}
      <Modal
        title={<><SafetyOutlined /> 防泄密预览 — {previewFile?.originalName}</>}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => { handleDownload(previewFile); setPreviewVisible(false); }}>
            带水印下载
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>关闭</Button>,
        ]}
        width={800}
        destroyOnClose
      >
        <Watermark
          content={[currentUser?.realName || 'IPOC', `${currentUser?.phone?.slice(-4) || '****'} ${new Date().toLocaleString()}`]}
          font={{ color: 'rgba(255,0,0,0.12)', fontSize: 16 }}
          gap={[120, 120]}
          rotate={-22}
        >
          <div style={{ minHeight: 400, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fafafa', borderRadius: 8 }}>
            {previewFile && isImage(previewFile.fileExt) ? (
              <Image
                src={`/api/v1/upload/${previewFile.id}/download`}
                style={{ maxWidth: '100%', maxHeight: 500 }}
                preview={false}
                alt={previewFile.originalName}
              />
            ) : (
              <Text type="secondary">此文件类型不支持在线预览，请下载后查看</Text>
            )}
          </div>
        </Watermark>
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            防泄密水印已叠加：{currentUser?.realName} | 手机尾号 {currentUser?.phone?.slice(-4) || '****'} | {new Date().toLocaleString()}
          </Text>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default DigitalAssetPage;
