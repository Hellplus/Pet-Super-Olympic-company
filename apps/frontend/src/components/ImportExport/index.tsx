import React, { useRef, useState } from 'react';
import { Button, Space, message, Modal, Table, Tag, Typography } from 'antd';
import { DownloadOutlined, UploadOutlined, FileExcelOutlined, EyeOutlined } from '@ant-design/icons';
import { downloadTemplate, importData } from '@/services/export';
import * as XLSX from 'xlsx';

const { Text } = Typography;

interface ImportExportProps {
  exportFn: (params?: any) => Promise<void>;
  exportParams?: any;
  importType?: string;
  onImportSuccess?: () => void;
}

const ImportExport: React.FC<ImportExportProps> = ({
  exportFn,
  exportParams,
  importType,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<any[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

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

    // 客户端解析Excel预览
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length < 2) {
        message.warning('文件内容为空或仅有表头');
        return;
      }

      const headers = jsonData[0] as string[];
      const cols = headers.map((h, i) => ({
        title: h || `列${i + 1}`,
        dataIndex: `col_${i}`,
        key: `col_${i}`,
        width: 120,
        ellipsis: true,
      }));

      const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== '')).map((row, idx) => {
        const obj: any = { _rowKey: idx };
        headers.forEach((_, i) => { obj[`col_${i}`] = row[i] ?? ''; });
        return obj;
      });

      setPreviewColumns(cols);
      setPreviewData(rows);
      setPendingFile(file);
      setPreviewVisible(true);
    } catch {
      message.error('文件解析失败，请检查文件格式');
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingFile || !importType) return;
    setImporting(true);
    try {
      const result = await importData(importType, pendingFile);
      const data = result?.data || result;
      setPreviewVisible(false);
      setPendingFile(null);
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
      message.error('导入失败');
    } finally { setImporting(false); }
  };

  return (
    <>
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

      <Modal
        title={<><EyeOutlined /> 导入数据预览</>}
        open={previewVisible}
        onCancel={() => { setPreviewVisible(false); setPendingFile(null); }}
        onOk={handleConfirmImport}
        okText="确认导入"
        cancelText="取消"
        okButtonProps={{ loading: importing }}
        width={900}
        destroyOnClose
      >
        <div style={{ marginBottom: 12 }}>
          <Space>
            <Tag color="blue">文件: {pendingFile?.name}</Tag>
            <Tag color="green">共 {previewData.length} 条数据</Tag>
          </Space>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">请确认以下数据无误后点击"确认导入"，数据将提交至服务器处理。</Text>
          </div>
        </div>
        <Table
          columns={previewColumns}
          dataSource={previewData.slice(0, 100)}
          rowKey="_rowKey"
          size="small"
          scroll={{ x: 'max-content', y: 400 }}
          pagination={false}
          bordered
        />
        {previewData.length > 100 && (
          <div style={{ textAlign: 'center', padding: 8, color: '#999', fontSize: 12 }}>
            仅预览前 100 条，共 {previewData.length} 条
          </div>
        )}
      </Modal>
    </>
  );
};

export default ImportExport;
