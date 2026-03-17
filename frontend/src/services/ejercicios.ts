import api from './api';
import type { Ejercicio, PaginatedResponse } from '../types';

export interface EjercicioFilters {
  search?: string;
  grupo_muscular?: string;
  equipamiento?: string;
  tipo?: string;
  dificultad?: string;
  per_page?: number;
}

export interface CreateEjercicioData {
  nombre: string;
  nombre_alternativo?: string;
  descripcion?: string;
  instrucciones?: string;
  grupos_musculares: string[];
  equipamiento?: string[];
  tipo: 'fuerza' | 'cardio' | 'flexibilidad' | 'potencia' | 'resistencia';
  dificultad: 'principiante' | 'intermedio' | 'avanzado';
  video_url?: string;
  imagen_url?: string;
}

// Listar ejercicios
export const getEjercicios = async (filters: EjercicioFilters = {}) => {
  const response = await api.get<{ data: Ejercicio[] | PaginatedResponse<Ejercicio> }>('/ejercicios', { params: filters });
  return response.data.data;
};

// Obtener ejercicio por ID
export const getEjercicio = async (id: number) => {
  const response = await api.get<{ data: Ejercicio }>(`/ejercicios/${id}`);
  return response.data.data;
};

// Crear ejercicio
export const createEjercicio = async (data: CreateEjercicioData) => {
  const response = await api.post<{ data: Ejercicio; message: string }>('/ejercicios', data);
  return response.data;
};

// Actualizar ejercicio
export const updateEjercicio = async (id: number, data: Partial<CreateEjercicioData>) => {
  const response = await api.put<{ data: Ejercicio; message: string }>(`/ejercicios/${id}`, data);
  return response.data;
};

// Eliminar ejercicio
export const deleteEjercicio = async (id: number) => {
  const response = await api.delete<{ message: string }>(`/ejercicios/${id}`);
  return response.data;
};

// Grupos musculares disponibles
export const GRUPOS_MUSCULARES = [
  'pecho',
  'espalda',
  'espalda alta',
  'espalda baja',
  'hombros',
  'hombros posteriores',
  'biceps',
  'triceps',
  'antebrazos',
  'cuadriceps',
  'isquiotibiales',
  'gluteos',
  'pantorrillas',
  'abductores',
  'abdominales',
  'oblicuos',
  'core',
  'trapecios',
  'cadera',
  'cardio',
  'cuerpo completo',
];

// Equipamiento disponible
export const EQUIPAMIENTO = [
  'peso corporal',
  'barra',
  'barra EZ',
  'mancuernas',
  'mancuerna',
  'kettlebell',
  'kettlebells',
  'banco plano',
  'banco inclinado',
  'banco declinado',
  'banco',
  'banco romano',
  'banco scott',
  'rack',
  'poleas',
  'polea',
  'polea alta',
  'polea baja',
  'soga',
  'máquina',
  'máquina prensa',
  'máquina hack',
  'paralelas',
  'barra fija',
  'cajón',
  'rueda abdominal',
  'pelota medicinal',
  'foam roller',
  'cinta',
  'bicicleta',
  'elíptica',
  'remo',
  'soga',
  'prensa',
];
