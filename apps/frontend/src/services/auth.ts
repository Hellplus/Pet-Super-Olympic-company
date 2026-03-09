import { request } from '@umijs/max';

export async function login(data: { username: string; password: string }) {
  return request('/auth/login', { method: 'POST', data });
}

export async function refreshToken(data: { refreshToken: string }) {
  return request('/auth/refresh', { method: 'POST', data });
}

export async function logout() {
  return request('/auth/logout', { method: 'POST' });
}

export async function changePassword(data: { oldPassword: string; newPassword: string }) {
  return request('/auth/change-password', { method: 'POST', data });
}
