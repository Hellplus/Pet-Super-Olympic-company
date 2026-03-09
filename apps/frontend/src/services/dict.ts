import { request } from '@umijs/max';

export async function getDictTypes() {
  return request('/dict/types', { method: 'GET' });
}
export async function createDictType(data: any) {
  return request('/dict/types', { method: 'POST', data });
}
export async function updateDictType(id: string, data: any) {
  return request('/dict/types/' + id, { method: 'PUT', data });
}
export async function deleteDictType(id: string) {
  return request('/dict/types/' + id, { method: 'DELETE' });
}
export async function getDictDataByType(typeCode: string) {
  return request('/dict/data/' + typeCode, { method: 'GET' });
}
export async function createDictData(data: any) {
  return request('/dict/data', { method: 'POST', data });
}
export async function updateDictData(id: string, data: any) {
  return request('/dict/data/' + id, { method: 'PUT', data });
}
export async function deleteDictData(id: string) {
  return request('/dict/data/' + id, { method: 'DELETE' });
}
