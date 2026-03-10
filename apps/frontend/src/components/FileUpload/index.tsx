import React, { useState } from 'react';
import { Upload, Button, message, Modal } from 'antd';
import { UploadOutlined, InboxOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

interface FileUploadProps {
  bizType?: string;
  bizId?: string;
  maxCount?: number;
  accept?: string;
  onChange?: (fileList: any[]) => void;
  value?: any[];
  listType?: 'text' | 'picture' | 'picture-card';
  maxSize?: number; // MB
}

const FileUpload: React.FC<FileUploadProps> = ({
  bizType, bizId, maxCount = 5, accept, onChange,
  value = [], listType = 'text', maxSize = 50,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const token = localStorage.getItem('accessToken');

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/v1/upload',
    headers: { Authorization: `Bearer ${token}` },
    data: { bizType, bizId },
    maxCount,
    accept,
    listType,
    defaultFileList: value,
    beforeUpload: (file) => {
      if (file.size / 1024 / 1024 > maxSize) {
        message.error(`文件大小不能超过 ${maxSize}MB`);
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
      onChange?.(info.fileList);
    },
    onPreview: async (file) => {
      const url = file.url || file.response?.data?.filePath;
      if (url && /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || '')) {
        setPreviewImage(url);
        setPreviewOpen(true);
      } else {
        // 触发下载
        const fileId = file.response?.data?.id;
        if (fileId) {
          window.open(`/api/v1/upload/${fileId}/download`, '_blank');
        }
      }
    },
  };

  return (
    <>
      <Upload {...uploadProps}>
        {listType === 'picture-card' ? (
          <div>
            <UploadOutlined />
            <div style={{ marginTop: 8 }}>上传</div>
          </div>
        ) : (
          <Button icon={<UploadOutlined />}>点击上传</Button>
        )}
      </Upload>
      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};

export default FileUpload;
