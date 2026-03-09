import { request } from '@umijs/max';
export async function getEvents(params: any) { return request('/events', { method: 'GET', params }); }
export async function getEvent(id: string) { return request('/events/' + id, { method: 'GET' }); }
export async function createEvent(data: any) { return request('/events', { method: 'POST', data }); }
export async function updateEventStatus(id: string, status: number) { return request('/events/' + id + '/status', { method: 'POST', data: { status } }); }
export async function getEventProgress(id: string) { return request('/events/' + id + '/progress', { method: 'GET' }); }
export async function getSopTemplates() { return request('/events/sop-templates', { method: 'GET' }); }
export async function getSopTemplate(id: string) { return request('/events/sop-templates/' + id, { method: 'GET' }); }
export async function createSopTemplate(data: any) { return request('/events/sop-templates', { method: 'POST', data }); }
export async function updateTaskStatus(taskId: string, data: any) { return request('/events/tasks/' + taskId + '/status', { method: 'POST', data }); }
export async function getAnnouncements() { return request('/events/announcements', { method: 'GET' }); }
export async function createAnnouncement(data: any) { return request('/events/announcements', { method: 'POST', data }); }
export async function publishAnnouncement(id: string) { return request('/events/announcements/' + id + '/publish', { method: 'POST' }); }
export async function markAsRead(id: string) { return request('/events/announcements/' + id + '/read', { method: 'POST' }); }
export async function getReadStatus(id: string) { return request('/events/announcements/' + id + '/read-status', { method: 'GET' }); }
export async function getDigitalAssets() { return request('/events/digital-assets', { method: 'GET' }); }
export async function uploadDigitalAsset(data: any) { return request('/events/digital-assets', { method: 'POST', data }); }
