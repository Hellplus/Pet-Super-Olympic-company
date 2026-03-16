import React, { useRef } from 'react';
import { Button, Space, Upload, message, Modal } from 'antd';
import { DownloadOutlined, UploadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { downloadTemplate, importData } from '@/services/export';

interface ImportExportProps {
  exportFn: (params?: any) => Promise<void>;
  exportParams?: any;
  importType?: string; // experts | certificates | revenues
  onImportSuccess?: () => void;
}

const ImportExport: React.FC<ImportExportProps> = ({
  exportFn,
  exportParams,
  importType,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const hide = message.loading('正在导出...');
    try {
      await exportFn(exportParams);
      hide();
      message.success('导出成功');
    } catch {
      hide();
      message.error('导出失败');
    }
  };

  const handleDownloadTemplate = async () => {
    if (!importType) return;
    try {
      await downloadTemplate(importType);
    } catch {
      message.error('下载模板失败');
    }
  };

  const handleImport = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importType) return;
    e.target.value = '';

    const hide = message.loading('正在导入...');
    try {
      const result = await importData(importType, file);
      hide();
      const data = result?.data || result;
      Modal.info({
        title: '导入结果',
        content: (
          <div>
            <p>总行数: {data.total}</p>
            <p>成功: {data.success}</p>
            <p>失败: {data.failed}</p>
            {data.errors?.length > 0 && (
              <div style={{ maxHeight: 200, overflow: 'auto', fontSize: 12, color: '#ff4d4f' }}>
                {data.errors.map((err: string, i: number) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            )}
          </div>
        ),
      });
      if (data.success > 0) onImportSuccess?.();
    } catch {
      hide();
      message.error('导入失败');
    }
  };

  return (
    <Space>
      <Button icon={<DownloadOutlined />} onClick={handleExport}>
        导出Excel
      </Button>
      {importType && (
        <>
          <Button icon={<FileExcelOutlined />} onClick={handleDownloadTemplate}>
            下载模板
          </Button>
          <Button icon={<UploadOutlined />} onClick={handleImport}>
            导入Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </>
      )}
    </Space>
  );
};

export default ImportExport;
