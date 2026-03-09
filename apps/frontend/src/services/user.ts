import { request } from '@umijs/max';

export async function getUsers(params: any) {
  return request('/users', { method: 'GET', params });
}
export async function getUser(id: string) {
  return request('/users/' + id, { method: 'GET' });
}
export async function createUser(data: any) {
  return request('/users', { method: 'POST', data });
}
export async function updateUser(id: string, data: any) {
  return request('/users/' + id, { method: 'PUT', data });
}
export async function deleteUser(id: string) {
  return request('/users/' + id, { method: 'DELETE' });
}
export async function assignRoles(userId: string, roleIds: string[]) {
  return request('/users/' + userId + '/assign-roles', { method: 'POST', data: { roleIds } });
}
export async function disableUser(id: string) {
  return request('/users/' + id + '/disable', { method: 'POST' });
}
export async function enableUser(id: string) {
  return request('/users/' + id + '/enable', { method: 'POST' });
}
