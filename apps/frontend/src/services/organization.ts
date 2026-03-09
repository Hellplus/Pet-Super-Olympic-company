import { request } from '@umijs/max';

export async function getOrgTree() {
  return request('/organizations/tree', { method: 'GET' });
}
export async function getOrg(id: string) {
  return request('/organizations/' + id, { method: 'GET' });
}
export async function createOrg(data: any) {
  return request('/organizations', { method: 'POST', data });
}
export async function updateOrg(id: string, data: any) {
  return request('/organizations/' + id, { method: 'PUT', data });
}
export async function deleteOrg(id: string) {
  return request('/organizations/' + id, { method: 'DELETE' });
}
export async function moveOrg(data: { nodeId: string; newParentId: string }) {
  return request('/organizations/move', { method: 'POST', data });
}
export async function disableOrg(id: string) {
  return request('/organizations/' + id + '/disable', { method: 'POST' });
}
