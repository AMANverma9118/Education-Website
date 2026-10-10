import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error.response?.data;
    const message = data?.message || error.message || 'Request failed.';
    const err = new Error(message);
    err.status = error.response?.status;
    err.errors = Array.isArray(data?.errors) ? data.errors : [];
    return Promise.reject(err);
  }
);
