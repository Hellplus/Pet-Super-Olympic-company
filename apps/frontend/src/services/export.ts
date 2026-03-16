import { request } from '@umijs/max';

const downloadFile = async (url: string, params?: any) => {
  const response = await request(url, {
    method: 'GET',
    params,
    responseType: 'blob',
    getResponse: true,
  });
  const blob = response.data;
  const disposition = response.response?.headers?.get('content-disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?(.+)/i);
  const fileName = match ? decodeURIComponent(match[1]) : 'export.xlsx';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const exportExperts = (params?: any) => downloadFile('/api/v1/export/experts', params);
export const exportCertificates = (params?: any) => downloadFile('/api/v1/export/certificates', params);
export const exportRevenues = (params?: any) => downloadFile('/api/v1/export/revenues', params);
export const exportExpenses = (params?: any) => downloadFile('/api/v1/export/expenses', params);
export const exportContracts = (params?: any) => downloadFile('/api/v1/export/contracts', params);
export const exportClients = (params?: any) => downloadFile('/api/v1/export/clients', params);
export const exportEvents = (params?: any) => downloadFile('/api/v1/export/events', params);
export const exportBudgets = (params?: any) => downloadFile('/api/v1/export/budgets', params);
export const exportSettlements = (params?: any) => downloadFile('/api/v1/export/settlements', params);

export const downloadTemplate = (type: string) => downloadFile(`/api/v1/export/template/${type}`);

export const importData = async (type: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return request(`/api/v1/export/import/${type}`, {
    method: 'POST',
    data: formData,
    requestType: 'form',
  });
};
