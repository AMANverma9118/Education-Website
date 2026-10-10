import { api } from './client.js';

export async function signup(payload) {
  const { data } = await api.post('/auth/signup', payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export async function logout() {
  const { data } = await api.post('/auth/logout');
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data;
}
