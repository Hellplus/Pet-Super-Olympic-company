import { request } from '@umijs/max';

export async function getRoles(params: any) {
  return request('/roles', { method: 'GET', params });
}
export async function getRole(id: string) {
  return request('/roles/' + id, { method: 'GET' });
}
export async function createRole(data: any) {
  return request('/roles', { method: 'POST', data });
}
export async function updateRole(id: string, data: any) {
  return request('/roles/' + id, { method: 'PUT', data });
}
export async function deleteRole(id: string) {
  return request('/roles/' + id, { method: 'DELETE' });
}
export async function assignPermissions(roleId: string, permissionIds: string[]) {
  return request('/roles/' + roleId + '/permissions', { method: 'POST', data: { permissionIds } });
}
export async function getRolePermissionIds(roleId: string) {
  return request('/roles/' + roleId + '/permission-ids', { method: 'GET' });
}
