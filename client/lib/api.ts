import axios from 'axios';

function normalizeBaseURL(value?: string) {
  const fallback = 'http://localhost:5000';
  const raw = (value || fallback).trim().replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw.slice(0, -4) : raw;
}

const api = axios.create({
  baseURL: normalizeBaseURL(process.env.NEXT_PUBLIC_API_URL),
  withCredentials: true,
  timeout: 12000
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        // Handle role redirection if needed, or let component handle it
        console.error('Forbidden role access');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
