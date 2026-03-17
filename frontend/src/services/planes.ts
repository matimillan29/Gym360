import api from './api';
import type { Macrociclo, Mesociclo, Microciclo, Sesion, SesionEjercicio } from '../types';

// =====================================================
// MACROCICLOS
// =====================================================

export interface CreateMacrocicloData {
  nombre: string;
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  objetivo?: string;
  notas?: string;
}

// Listar macrociclos de un entrenado
export const getMacrociclos = async (entrenadoId: number) => {
  const response = await api.get<{ data: Macrociclo[] }>(`/entrenados/${entrenadoId}/macrociclos`);
  return response.data.data;
};

// Obtener macrociclo con mesociclos
export const getMacrociclo = async (id: number) => {
  const response = await api.get<{ data: Macrociclo }>(`/macrociclos/${id}`);
  return response.data.data;
};

// Crear macrociclo
export const createMacrociclo = async (entrenadoId: number, data: CreateMacrocicloData) => {
  const response = await api.post<{ data: Macrociclo; message: string }>(`/entrenados/${entrenadoId}/macrociclos`, data);
  return response.data;
};

// Actualizar macrociclo
export const updateMacrociclo = async (id: number, data: Partial<CreateMacrocicloData>) => {
  const response = await api.put<{ data: Macrociclo; message: string }>(`/macrociclos/${id}`, data);
  return response.data;
};

// Eliminar macrociclo
export const deleteMacrociclo = async (id: number) => {
  const response = await api.delete<{ message: string }>(`/macrociclos/${id}`);
  return response.data;
};

// Activar macrociclo
export const activarMacrociclo = async (id: number) => {
  const response = await api.post<{ data: Macrociclo; message: string }>(`/macrociclos/${id}/activar`);
  return response.data;
};

// Duplicar macrociclo
export const duplicarMacrociclo = async (id: number, nombre: string, entrenadoId?: number) => {
  const response = await api.post<{ data: Macrociclo; message: string }>(`/macrociclos/${id}/duplicar`, {
    nombre,
    entrenado_id: entrenadoId,
  });
  return response.data;
};

// =====================================================
// MESOCICLOS
// =====================================================

export interface CreateMesocicloData {
  nombre: string;
  tipo: 'preparatorio' | 'competitivo' | 'transicion' | 'acumulacion' | 'transmutacion' | 'realizacion';
  duracion_semanas: number;
  objetivo?: string;
  notas?: string;
}

// Listar mesociclos de un macrociclo
export const getMesociclos = async (macrocicloId: number) => {
  const response = await api.get<{ data: Mesociclo[] }>(`/macrociclos/${macrocicloId}/mesociclos`);
  return response.data.data;
};

// Obtener mesociclo con microciclos
export const getMesociclo = async (id: number) => {
  const response = await api.get<{ data: Mesociclo }>(`/mesociclos/${id}`);
  return response.data.data;
};

// Crear mesociclo
export const createMesociclo = async (macrocicloId: number, data: CreateMesocicloData) => {
  const response = await api.post<{ data: Mesociclo; message: string }>(`/macrociclos/${macrocicloId}/mesociclos`, data);
  return response.data;
};

// Actualizar mesociclo
export const updateMesociclo = async (id: number, data: Partial<CreateMesocicloData>) => {
  const response = await api.put<{ data: Mesociclo; message: string }>(`/mesociclos/${id}`, data);
  return response.data;
};

// Eliminar mesociclo
export const deleteMesociclo = async (id: number) => {
  const response = await api.delete<{ message: string }>(`/mesociclos/${id}`);
  return response.data;
};

// Desbloquear mesociclo
export const desbloquearMesociclo = async (id: number) => {
  const response = await api.post<{ data: Mesociclo; message: string }>(`/mesociclos/${id}/desbloquear`);
  return response.data;
};

// =====================================================
// MICROCICLOS
// =====================================================

export interface CreateMicrocicloData {
  nombre: string;
  tipo: 'carga' | 'descarga' | 'competicion' | 'recuperacion' | 'test';
  objetivo?: string;
  notas?: string;
}

// Listar microciclos de un mesociclo
export const getMicrociclos = async (mesocicloId: number) => {
  const response = await api.get<{ data: Microciclo[] }>(`/mesociclos/${mesocicloId}/microciclos`);
  return response.data.data;
};

// Obtener microciclo con sesiones
export const getMicrociclo = async (id: number) => {
  const response = await api.get<{ data: Microciclo }>(`/microciclos/${id}`);
  return response.data.data;
};

// Crear microciclo
export const createMicrociclo = async (mesocicloId: number, data: CreateMicrocicloData) => {
  const response = await api.post<{ data: Microciclo; message: string }>(`/mesociclos/${mesocicloId}/microciclos`, data);
  return response.data;
};

// Actualizar microciclo
export const updateMicrociclo = async (id: number, data: Partial<CreateMicrocicloData>) => {
  const response = await api.put<{ data: Microciclo; message: string }>(`/microciclos/${id}`, data);
  return response.data;
};

// Eliminar microciclo
export const deleteMicrociclo = async (id: number) => {
  const response = await api.delete<{ message: string }>(`/microciclos/${id}`);
  return response.data;
};

// =====================================================
// SESIONES
// =====================================================

export interface CreateSesionData {
  numero: number;
  fecha_programada?: string;
  logica_entrenamiento?: string;
  observaciones?: string;
}

// Listar sesiones de un microciclo
export const getSesiones = async (microcicloId: number) => {
  const response = await api.get<{ data: Sesion[] }>(`/microciclos/${microcicloId}/sesiones`);
  return response.data.data;
};

// Obtener sesión con ejercicios
export const getSesion = async (id: number) => {
  const response = await api.get<{ data: Sesion }>(`/sesiones/${id}`);
  return response.data.data;
};

// Crear sesión
export const createSesion = async (microcicloId: number, data: CreateSesionData) => {
  const response = await api.post<{ data: Sesion; message: string }>(`/microciclos/${microcicloId}/sesiones`, data);
  return response.data;
};

// Actualizar sesión
export const updateSesion = async (id: number, data: Partial<CreateSesionData>) => {
  const response = await api.put<{ data: Sesion; message: string }>(`/sesiones/${id}`, data);
  return response.data;
};

// Eliminar sesión
export const deleteSesion = async (id: number) => {
  const response = await api.delete<{ message: string }>(`/sesiones/${id}`);
  return response.data;
};

// =====================================================
// EJERCICIOS DE SESIÓN
// =====================================================

export interface CreateSesionEjercicioData {
  ejercicio_id: number;
  orden: number;
  etapa: string;
  series: number;
  repeticiones?: number;
  tiempo?: number;
  intensidad_tipo?: 'rir' | 'rpe' | 'porcentaje';
  intensidad_valor?: number;
  descanso?: number;
  observaciones?: string;
  superserie_con?: number;
}

// Agregar ejercicio a sesión
export const agregarEjercicio = async (sesionId: number, data: CreateSesionEjercicioData) => {
  const response = await api.post<{ data: SesionEjercicio; message: string }>(`/sesiones/${sesionId}/ejercicios`, data);
  return response.data;
};

// Actualizar ejercicio de sesión
export const actualizarEjercicio = async (sesionId: number, ejercicioId: number, data: Partial<CreateSesionEjercicioData>) => {
  const response = await api.put<{ data: SesionEjercicio; message: string }>(`/sesiones/${sesionId}/ejercicios/${ejercicioId}`, data);
  return response.data;
};

// Eliminar ejercicio de sesión
export const eliminarEjercicio = async (sesionId: number, ejercicioId: number) => {
  const response = await api.delete<{ message: string }>(`/sesiones/${sesionId}/ejercicios/${ejercicioId}`);
  return response.data;
};

// Reordenar ejercicios
export const reordenarEjercicios = async (sesionId: number, ejerciciosIds: number[]) => {
  const response = await api.post<{ message: string }>(`/sesiones/${sesionId}/ejercicios/reordenar`, {
    ejercicios: ejerciciosIds,
  });
  return response.data;
};

// =====================================================
// PARA ENTRENADOS
// =====================================================

// Obtener mi plan activo
export const getMiPlanActivo = async () => {
  const response = await api.get<{ data: Macrociclo | null; message?: string }>('/mi/plan');
  return response.data.data;
};

// Obtener mi sesión de hoy
export const getMiSesionHoy = async () => {
  const response = await api.get<{ data: Sesion | null; message?: string }>('/mi/plan/sesion-hoy');
  return response.data.data;
};

// Iniciar sesión de entrenamiento
export const iniciarSesion = async (sesionId: number) => {
  const response = await api.post<{ data: unknown; message: string }>(`/mi/sesiones/${sesionId}/iniciar`);
  return response.data;
};

// Finalizar sesión de entrenamiento
export const finalizarSesion = async (sesionId: number, data: { sensacion?: number; observaciones?: string }) => {
  const response = await api.post<{ data: unknown; message: string }>(`/mi/sesiones/${sesionId}/finalizar`, data);
  return response.data;
};

// Registrar desempeño de ejercicio
export interface SerieRealizada {
  repeticiones: number;
  peso?: number;
  rir?: number;
  rpe?: number;
  completada?: boolean;
}

export const registrarEjercicio = async (sesionId: number, ejercicioId: number, data: {
  series_realizadas: SerieRealizada[];
  observaciones?: string;
}) => {
  const response = await api.post<{ data: unknown; message: string }>(
    `/mi/sesiones/${sesionId}/ejercicios/${ejercicioId}/registrar`,
    data
  );
  return response.data;
};
