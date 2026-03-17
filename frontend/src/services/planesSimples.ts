import api from './api';

export interface CreateDiaEjercicioData {
  ejercicio_id: number;
  orden: number;
  etapa?: string;
  series: number;
  repeticiones?: string;
  tiempo?: number;
  intensidad_tipo?: string;
  intensidad_valor?: number;
  descanso?: number;
  observaciones?: string;
  superserie_con?: number | null;
}

export interface CreateDiaData {
  numero: number;
  nombre?: string;
  logica_entrenamiento?: string;
  observaciones?: string;
  ejercicios: CreateDiaEjercicioData[];
}

export interface CreatePlanSimpleData {
  nombre: string;
  objetivo_general?: string;
  dias: CreateDiaData[];
}

export const getPlanesSimples = async (entrenadoId: number) => {
  const response = await api.get(`/entrenados/${entrenadoId}/planes-simples`);
  return response.data.data;
};

export const getPlanSimple = async (id: number) => {
  const response = await api.get(`/planes-simples/${id}`);
  return response.data.data;
};

export const createPlanSimple = async (entrenadoId: number, data: CreatePlanSimpleData) => {
  const response = await api.post(`/entrenados/${entrenadoId}/planes-simples`, data);
  return response.data;
};

export const updatePlanSimple = async (id: number, data: Partial<CreatePlanSimpleData>) => {
  const response = await api.put(`/planes-simples/${id}`, data);
  return response.data;
};

export const deletePlanSimple = async (id: number) => {
  const response = await api.delete(`/planes-simples/${id}`);
  return response.data;
};

export const activarPlanSimple = async (id: number) => {
  const response = await api.post(`/planes-simples/${id}/activar`);
  return response.data;
};

export const togglePlanComplejo = async (entrenadoId: number) => {
  const response = await api.post(`/entrenados/${entrenadoId}/toggle-plan-complejo`);
  return response.data;
};
