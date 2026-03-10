import { request } from '@umijs/max';

export async function getOverview() {
  return request('/dashboard/overview');
}

export async function getHqCommanderStats() {
  return request('/dashboard/hq-commander');
}

export async function getHqFinanceStats() {
  return request('/dashboard/hq-finance');
}

export async function getBranchStats() {
  return request('/dashboard/branch');
}
