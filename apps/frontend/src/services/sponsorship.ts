import { request } from '@umijs/max';
export async function getProtectedCategories() { return request('/sponsorship/protected-categories', { method: 'GET' }); }
export async function createProtectedCategory(data: any) { return request('/sponsorship/protected-categories', { method: 'POST', data }); }
export async function deleteProtectedCategory(id: string) { return request('/sponsorship/protected-categories/' + id, { method: 'DELETE' }); }
export async function checkCategory(category: string) { return request('/sponsorship/check-category', { method: 'GET', params: { category } }); }
export async function getClients(orgId?: string) { return request('/sponsorship/clients', { method: 'GET', params: { orgId } }); }
export async function createClient(data: any) { return request('/sponsorship/clients', { method: 'POST', data }); }
export async function referToHq(id: string) { return request('/sponsorship/clients/' + id + '/refer-hq', { method: 'POST' }); }
export async function getContracts(params: any) { return request('/sponsorship/contracts', { method: 'GET', params }); }
export async function createContract(data: any) { return request('/sponsorship/contracts', { method: 'POST', data }); }
export async function activateContract(id: string) { return request('/sponsorship/contracts/' + id + '/activate', { method: 'POST' }); }
export async function decomposeRights(id: string, tasks: any[]) { return request('/sponsorship/contracts/' + id + '/decompose', { method: 'POST', data: { tasks } }); }
export async function getDeliveryTasks(contractId: string) { return request('/sponsorship/contracts/' + contractId + '/tasks', { method: 'GET' }); }
export async function submitEvidence(taskId: string, data: any) { return request('/sponsorship/delivery-tasks/' + taskId + '/evidence', { method: 'POST', data }); }
