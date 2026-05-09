import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
});

apiClient.interceptors.request.use(async (config) => {
  if (config.headers?.Authorization) {
    return config;
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated Firebase user.');
  }

  const token = await currentUser.getIdToken();
  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      'Request failed';
    return Promise.reject(new Error(String(message)));
  }
);
