import api from './api';
import type { User, Anamnesis, PaginatedResponse } from '../types';

export interface EntrenadoFilters {
  search?: string;
  estado?: string;
  entrenador_id?: number;
  per_page?: number;
  page?: number;
}

export interface CreateEntrenadoData {
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  fecha_nacimiento?: string;
  profesion?: string;
  entrenador_asignado_id?: number;
}

// Listar entrenados
export const getEntrenados = async (filters: EntrenadoFilters = {}) => {
  const response = await api.get<PaginatedResponse<User>>('/entrenados', { params: filters });
  return response.data;
};

// Obtener entrenado por ID
export const getEntrenado = async (id: number) => {
  const response = await api.get<{ data: User }>(`/entrenados/${id}`);
  return response.data.data;
};

// Crear entrenado
export const createEntrenado = async (data: CreateEntrenadoData) => {
  const response = await api.post<{ data: User; message: string }>('/entrenados', data);
  return response.data;
};

// Actualizar entrenado
export const updateEntrenado = async (id: number, data: Partial<CreateEntrenadoData>) => {
  const response = await api.put<{ data: User; message: string }>(`/entrenados/${id}`, data);
  return response.data;
};

// Eliminar entrenado
export const deleteEntrenado = async (id: number) => {
  const response = await api.delete<{ message: string }>(`/entrenados/${id}`);
  return response.data;
};

// Dar de baja temporal
export const bajaTemporal = async (id: number) => {
  const response = await api.post<{ data: User; message: string }>(`/entrenados/${id}/baja-temporal`);
  return response.data;
};

// Reactivar entrenado
export const reactivarEntrenado = async (id: number) => {
  const response = await api.post<{ data: User; message: string }>(`/entrenados/${id}/reactivar`);
  return response.data;
};

// Asignar entrenador
export const asignarEntrenador = async (entrenadoId: number, entrenadorId: number) => {
  const response = await api.post<{ data: User; message: string }>(`/entrenados/${entrenadoId}/asignar-entrenador`, {
    entrenador_id: entrenadorId
  });
  return response.data;
};

// Obtener anamnesis de un entrenado
export const getAnamnesis = async (entrenadoId: number) => {
  const response = await api.get<{ data: Anamnesis | null }>(`/entrenados/${entrenadoId}/anamnesis`);
  return response.data.data;
};

// Crear anamnesis
export const createAnamnesis = async (entrenadoId: number, data: Partial<Anamnesis>) => {
  const response = await api.post<{ data: Anamnesis; message: string }>(`/entrenados/${entrenadoId}/anamnesis`, data);
  return response.data;
};

// Actualizar anamnesis
export const updateAnamnesis = async (entrenadoId: number, data: Partial<Anamnesis>) => {
  const response = await api.put<{ data: Anamnesis; message: string }>(`/entrenados/${entrenadoId}/anamnesis`, data);
  return response.data;
};
