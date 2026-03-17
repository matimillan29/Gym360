import api from './api';
import type { AuthResponse, SetupStatus, User } from '../types';

export const authService = {
  // Verificar estado de instalación
  async checkSetup(): Promise<SetupStatus> {
    const response = await api.get<SetupStatus>('/setup/status');
    return response.data;
  },

  // Login para entrenadores (email + password)
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('auth_token', response.data.token);
    return response.data;
  },

  // Solicitar código OTP para entrenados
  async requestOtp(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/otp/request', { email });
    return response.data;
  },

  // Verificar código OTP
  async verifyOtp(email: string, code: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/otp/verify', { email, code });
    localStorage.setItem('auth_token', response.data.token);
    return response.data;
  },

  // Login para entrenados (email + password MaMi+DNI)
  async loginEntrenado(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login-entrenado', { email, password });
    localStorage.setItem('auth_token', response.data.token);
    return response.data;
  },

  // Obtener usuario actual
  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ data: User }>('/auth/user');
    return response.data.data;
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
    }
  },

  // Verificar si hay token guardado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },
};
