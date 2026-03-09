import { request } from '@umijs/max';

export async function getPermissionTree() {
  return request('/permissions/tree', { method: 'GET' });
}
export async function getPermissions() {
  return request('/permissions', { method: 'GET' });
}
export async function createPermission(data: any) {
  return request('/permissions', { method: 'POST', data });
}
export async function updatePermission(id: string, data: any) {
  return request('/permissions/' + id, { method: 'PUT', data });
}
export async function deletePermission(id: string) {
  return request('/permissions/' + id, { method: 'DELETE' });
}
