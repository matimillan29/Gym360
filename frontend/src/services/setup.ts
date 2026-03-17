import api from './api';
import type { GymConfig } from '../types';

export interface SetupStatus {
  is_configured: boolean;
  has_admin: boolean;
}

export interface SetupData {
  gym_nombre: string;
  gym_logo?: File;
  gym_color?: string;
  admin_nombre: string;
  admin_apellido: string;
  admin_email: string;
  admin_password: string;
  admin_password_confirmation: string;
}

// Verificar estado de instalación
export const getSetupStatus = async (): Promise<SetupStatus> => {
  const response = await api.get<SetupStatus>('/setup/status');
  return response.data;
};

// Realizar configuración inicial
export const setup = async (data: SetupData) => {
  const formData = new FormData();

  formData.append('gym_nombre', data.gym_nombre);
  if (data.gym_logo) {
    formData.append('gym_logo', data.gym_logo);
  }
  if (data.gym_color) {
    formData.append('gym_color', data.gym_color);
  }
  formData.append('admin_nombre', data.admin_nombre);
  formData.append('admin_apellido', data.admin_apellido);
  formData.append('admin_email', data.admin_email);
  formData.append('admin_password', data.admin_password);
  formData.append('admin_password_confirmation', data.admin_password_confirmation);

  const response = await api.post<{ message: string; gym: GymConfig }>('/setup', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Obtener configuración del gym
export const getConfig = async () => {
  const response = await api.get<{ data: GymConfig | null }>('/config');
  return response.data.data;
};

// Actualizar configuración del gym
export const updateConfig = async (data: Partial<GymConfig>) => {
  const response = await api.put<{ data: GymConfig; message: string }>('/config', data);
  return response.data;
};

// Actualizar logo del gym
export const updateLogo = async (logo: File) => {
  const formData = new FormData();
  formData.append('logo', logo);

  const response = await api.post<{ data: GymConfig; message: string }>('/config/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
