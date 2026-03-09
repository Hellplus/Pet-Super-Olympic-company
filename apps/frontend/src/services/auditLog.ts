import { request } from '@umijs/max';

export async function getAuditLogs(params: any) {
  return request('/audit-logs', { method: 'GET', params });
}
export async function getAuditLog(id: string) {
  return request('/audit-logs/' + id, { method: 'GET' });
}
