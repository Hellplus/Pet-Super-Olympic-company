import { request } from '@umijs/max';
export async function getRevenues(params: any) { return request('/finance/revenues', { method: 'GET', params }); }
export async function createRevenue(data: any) { return request('/finance/revenues', { method: 'POST', data }); }
export async function getBills(orgId?: string) { return request('/finance/settlements', { method: 'GET', params: { orgId } }); }
export async function generateBill(data: any) { return request('/finance/settlements/generate', { method: 'POST', data }); }
export async function getBudgets(orgId?: string) { return request('/finance/budgets', { method: 'GET', params: { orgId } }); }
export async function getBudget(id: string) { return request('/finance/budgets/' + id, { method: 'GET' }); }
export async function createBudget(data: any) { return request('/finance/budgets', { method: 'POST', data }); }
export async function approveBudget(id: string, approve: boolean) { return request('/finance/budgets/' + id + '/approve', { method: 'POST', data: { approve } }); }
export async function getExpenses(params: any) { return request('/finance/expenses', { method: 'GET', params }); }
export async function createExpense(data: any) { return request('/finance/expenses', { method: 'POST', data }); }
export async function approveExpense(id: string, approve: boolean) { return request('/finance/expenses/' + id + '/approve', { method: 'POST', data: { approve } }); }
export async function confirmPayment(id: string, data: any) { return request('/finance/expenses/' + id + '/confirm-payment', { method: 'POST', data }); }
export async function getApprovalConfigs() { return request('/finance/approval-configs', { method: 'GET' }); }
export async function checkBudget(data: { budgetId: string; subject?: string; amount: number }) { return request('/finance/budget-check', { method: 'POST', data }); }
