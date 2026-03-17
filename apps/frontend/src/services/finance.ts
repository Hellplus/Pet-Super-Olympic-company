import { request } from '@umijs/max';
export async function getRevenues(params: any) { return request('/finance/revenues', { method: 'GET', params }); }
export async function createRevenue(data: any) { return request('/finance/revenues', { method: 'POST', data }); }
export async function getBills(orgId?: string) { return request('/finance/settlements', { method: 'GET', params: { orgId } }); }
export async function generateBill(data: any) { return request('/finance/settlements/generate', { method: 'POST', data }); }
export async function getBudgets(orgId?: string) { return request('/finance/budgets', { method: 'GET', params: { orgId } }); }
export async function getBudget(id: string) { return request('/finance/budgets/' + id, { method: 'GET' }); }
export async function createBudget(data: any) { return request('/finance/budgets', { method: 'POST', data }); }
export async function approveBudget(id: string, approve: boolean, opinion?: string) { return request('/finance/budgets/' + id + '/approve', { method: 'POST', data: { approve, opinion } }); }
export async function getExpenses(params: any) { return request('/finance/expenses', { method: 'GET', params }); }
export async function createExpense(data: any) { return request('/finance/expenses', { method: 'POST', data }); }
export async function approveExpense(id: string, approve: boolean, opinion?: string) { return request('/finance/expenses/' + id + '/approve', { method: 'POST', data: { approve, opinion } }); }
export async function forwardExpense(id: string, data: { toUserId: string; toUserName: string; opinion?: string }) { return request('/finance/expenses/' + id + '/forward', { method: 'POST', data }); }
export async function getApprovalRecords(bizType: string, bizId: string) { return request('/finance/approval-records/' + bizType + '/' + bizId, { method: 'GET' }); }
export async function confirmPayment(id: string, data: any) { return request('/finance/expenses/' + id + '/confirm-payment', { method: 'POST', data }); }
export async function getApprovalConfigs() { return request('/finance/approval-configs', { method: 'GET' }); }
export async function checkBudget(data: { budgetId: string; subject?: string; amount: number }) { return request('/finance/budget-check', { method: 'POST', data }); }
