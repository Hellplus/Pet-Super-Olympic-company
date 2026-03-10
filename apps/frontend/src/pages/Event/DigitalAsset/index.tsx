import React, { useRef } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, DownloadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { queryFiles, deleteFile } from '../../../services/upload';

const DigitalAssetPage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const columns: ProColumns[] = [
    { title: '文件名', dataIndex: 'originalName', ellipsis: true },
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
      title: '操作', width: 150, search: false,
      render: (_, record: any) => (
        <Space>
          <Button type="link" icon={<DownloadOutlined />} size="small"
            onClick={() => window.open(`/api/v1/upload/${record.id}/download`, '_blank')}>
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
      <ProTable
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
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
    </PageContainer>
  );
};

export default DigitalAssetPage;
