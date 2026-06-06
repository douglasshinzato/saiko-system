import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3333',
});

// Interceptor para injetar o token JWT em todas as requisições
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('@saiko:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
