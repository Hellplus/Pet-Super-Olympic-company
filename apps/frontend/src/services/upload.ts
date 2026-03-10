import { request } from '@umijs/max';

export async function uploadFile(file: File, params?: Record<string, any>) {
  const formData = new FormData();
  formData.append('file', file);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) formData.append(k, v);
    });
  }
  return request('/upload', { method: 'POST', data: formData });
}

export async function uploadFiles(files: File[], params?: Record<string, any>) {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) formData.append(k, v);
    });
  }
  return request('/upload/batch', { method: 'POST', data: formData });
}

export async function getFileInfo(id: string) {
  return request(`/upload/${id}/info`);
}

export async function queryFiles(params: Record<string, any>) {
  return request('/upload', { params });
}

export async function deleteFile(id: string) {
  return request(`/upload/${id}`, { method: 'DELETE' });
}
