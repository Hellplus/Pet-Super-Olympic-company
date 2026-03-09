import { request } from '@umijs/max';
export async function getApplications(params: any) { return request('/branch-hr/applications', { method: 'GET', params }); }
export async function createApplication(data: any) { return request('/branch-hr/applications', { method: 'POST', data }); }
export async function getApplication(id: string) { return request('/branch-hr/applications/' + id, { method: 'GET' }); }
export async function approveApplication(id: string, data: any) { return request('/branch-hr/applications/' + id + '/approve', { method: 'POST', data }); }
export async function getApprovalRecords(id: string) { return request('/branch-hr/applications/' + id + '/records', { method: 'GET' }); }
export async function getExperts(params: any) { return request('/branch-hr/experts', { method: 'GET', params }); }
export async function createExpert(data: any) { return request('/branch-hr/experts', { method: 'POST', data }); }
export async function updateExpert(id: string, data: any) { return request('/branch-hr/experts/' + id, { method: 'PUT', data }); }
export async function deleteExpert(id: string) { return request('/branch-hr/experts/' + id, { method: 'DELETE' }); }
export async function getExpertCertificates(expertId: string) { return request('/branch-hr/experts/' + expertId + '/certificates', { method: 'GET' }); }
export async function addCertificate(expertId: string, data: any) { return request('/branch-hr/experts/' + expertId + '/certificates', { method: 'POST', data }); }
export async function getExpertAssignments(expertId: string) { return request('/branch-hr/experts/' + expertId + '/assignments', { method: 'GET' }); }
