import api from './api';

export interface RachaData {
  actual: number;
  maxima: number;
  activa: boolean;
  ultimo_entrenamiento: string | null;
}

export interface EntrenamientosData {
  semana: number;
  mes: number;
  total: number;
}

export interface LogroData {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  categoria: string;
  desbloqueado: boolean;
  desbloqueado_en?: string;
}

export interface LogrosData {
  total: number;
  desbloqueados: number;
  recientes: LogroData[];
  por_categoria: Record<string, LogroData[]>;
}

export interface EstadisticasCompletas {
  racha: RachaData;
  entrenamientos: EntrenamientosData;
  logros: LogrosData;
}

export interface NuevoLogroResponse {
  nuevos_logros: Array<{
    id: number;
    nombre: string;
    descripcion: string;
    icono: string;
    color: string;
  }>;
  racha_actual: number;
}

// Obtener estadísticas completas (rachas, logros, etc.)
export const getMisEstadisticas = async (): Promise<EstadisticasCompletas> => {
  const response = await api.get<{ data: EstadisticasCompletas }>('/mi/estadisticas');
  return response.data.data;
};

// Verificar y otorgar logros después de entrenar
export const verificarLogros = async (): Promise<NuevoLogroResponse> => {
  const response = await api.post<{ data: NuevoLogroResponse }>('/mi/verificar-logros');
  return response.data.data;
};

// Marcar logros como vistos
export const marcarLogrosVistos = async (): Promise<void> => {
  await api.post('/mi/logros/marcar-vistos');
};

// Obtener logros nuevos (no vistos)
export const getLogrosNuevos = async (): Promise<LogroData[]> => {
  const response = await api.get<{ data: LogroData[] }>('/mi/logros/nuevos');
  return response.data.data;
};
