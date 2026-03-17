import axios from 'axios';

// En producción (Cloudron), la API está en el mismo dominio
// En desarrollo, Vite hace proxy a localhost:8000
const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Solo redirigir si no estamos ya en login o setup
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/setup')) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
