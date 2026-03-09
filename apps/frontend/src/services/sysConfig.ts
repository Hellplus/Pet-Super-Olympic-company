import { request } from '@umijs/max';

export async function getSysConfigs() {
  return request('/sys-config', { method: 'GET' });
}
export async function upsertSysConfig(data: any) {
  return request('/sys-config', { method: 'POST', data });
}
export async function deleteSysConfig(id: string) {
  return request('/sys-config/' + id, { method: 'DELETE' });
}
