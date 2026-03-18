// Tipos base del sistema

export type UserRole = 'admin' | 'entrenador' | 'entrenado';
export type UserStatus = 'activo' | 'baja_temporal' | 'inactivo';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  usuario?: string;
  nombre: string;
  apellido: string;
  dni?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  profesion?: string;
  foto?: string;
  estado: UserStatus;
  entrenador_asignado_id?: number;
  plan_complejo?: boolean;
  entrenador?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  anamnesis?: {
    id: number;
    icono_objetivo?: string;
    objetivos_principales?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface GymConfig {
  id: number;
  nombre: string;
  logo?: string;
  color_principal: string;
  color_secundario: string;
  multi_sucursal?: boolean;
  direccion?: string;
  telefono?: string;
  email?: string;
  redes_sociales?: Record<string, string>;
  dias_aviso_vencimiento: number;
  notificar_vencimiento: boolean;
  notificar_nuevo_plan: boolean;
}

export interface Ejercicio {
  id: number;
  nombre: string;
  nombre_alternativo?: string;
  descripcion?: string;
  instrucciones?: string;
  video_url?: string;
  etapas: string[];
  categorias_zona: string[];
  patrones_movimiento: string[];
  grupos_musculares: string[];
  equipamiento?: string[];
  tipo?: 'fuerza' | 'cardio' | 'flexibilidad' | 'potencia' | 'resistencia';
  dificultad?: 'principiante' | 'intermedio' | 'avanzado';
  es_personalizado?: boolean;
  es_global: boolean;
  creado_por?: number;
  created_at?: string;
}

export interface Macrociclo {
  id: number;
  entrenado_id: number;
  nombre?: string;
  tipo_plan?: 'simple' | 'complejo';
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  objetivo_general?: string;
  activo: boolean;
  mesociclos?: Mesociclo[];
}

export interface Mesociclo {
  id: number;
  macrociclo_id: number;
  numero: number;
  nombre: string;
  objetivo?: string;
  tipo: string;
  desbloqueado: boolean;
  microciclos?: Microciclo[];
}

export interface Microciclo {
  id: number;
  mesociclo_id: number;
  numero: number;
  tipo: 'introductorio' | 'desarrollo' | 'estabilizacion' | 'descarga';
  sesiones?: Sesion[];
}

export interface Sesion {
  id: number;
  microciclo_id: number;
  numero: number;
  fecha_programada?: string;
  logica_entrenamiento?: string;
  observaciones?: string;
  ejercicios?: SesionEjercicio[];
}

export interface SesionEjercicio {
  id: number;
  sesion_id: number;
  ejercicio_id: number;
  ejercicio?: Ejercicio;
  orden: number;
  etapa: string;
  series: number;
  repeticiones?: number;
  tiempo?: number;
  intensidad_tipo: 'rir' | 'rpe' | 'porcentaje';
  intensidad_valor?: number;
  descanso?: number;
  observaciones?: string;
  superserie_con?: number;
}

export interface RegistroSesion {
  id: number;
  sesion_id: number;
  entrenado_id: number;
  fecha: string;
  estado: 'completado' | 'parcial' | 'falto';
  feedback_general?: string;
  registros_ejercicio?: RegistroEjercicio[];
}

export interface RegistroEjercicio {
  id: number;
  registro_sesion_id: number;
  sesion_ejercicio_id: number;
  peso?: number;
  repeticiones?: number;
  series_completadas?: number;
  intensidad_percibida?: number;
  descanso_real?: number;
  completado: boolean;
  observaciones?: string;
}

export interface Anamnesis {
  id: number;
  entrenado_id: number;
  peso?: number;
  altura?: number;
  medidas?: {
    hombros?: number;
    torax?: number;
    cintura?: number;
    cadera?: number;
    muslo_derecho?: number;
    muslo_izquierdo?: number;
    gemelo_derecho?: number;
    gemelo_izquierdo?: number;
    brazo_derecho?: number;
    brazo_izquierdo?: number;
  };
  lesiones_previas?: string;
  lesiones_actuales?: string;
  cirugias?: string;
  molestias?: string;
  condiciones_medicas?: string;
  medicacion?: string;
  alergias?: string;
  experiencia_gym?: 'ninguna' | 'principiante' | 'intermedio' | 'avanzado';
  años_entrenamiento?: number;
  deportes?: string;
  frecuencia_actual?: string;
  objetivos_principales?: string;
  objetivos_secundarios?: string;
  disponibilidad_dias?: number;
  tiempo_por_sesion?: string;
  ejercicios_contraindicados?: string;
  limitaciones_movimiento?: string;
  equipamiento_casa?: string;
  notas?: string;
}

export interface PlanCuota {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: 'mensual_libre' | 'semanal_2x' | 'semanal_3x' | 'pack_clases' | 'personalizado';
  cantidad_accesos?: number;
  duracion_dias: number;
  precio: number;
  activo: boolean;
}

export interface Cuota {
  id: number;
  entrenado_id: number;
  plan_id: number;
  plan?: PlanCuota;
  fecha_inicio: string;
  fecha_vencimiento: string;
  monto: number;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'mora';
}

export interface Pago {
  id: number;
  cuota_id: number;
  fecha: string;
  monto: number;
  metodo: 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'otro';
  comprobante?: string;
  notas?: string;
}

export interface Evaluacion {
  id: number;
  entrenado_id: number;
  entrenador_id: number;
  tipo: string;
  nombre: string;
  descripcion?: string;
  valor?: number;
  unidad?: string;
  fecha: string;
}

export interface LinkAdjunto {
  id: number;
  entrenado_id: number;
  entrenador_id: number;
  titulo: string;
  url: string;
  descripcion?: string;
  categoria: 'video_tecnica' | 'articulo' | 'recurso' | 'otro';
}

export interface Feedback {
  id: number;
  entrenado_id: number;
  entrenador_id: number;
  tipo: 'progreso' | 'actitud' | 'asistencia' | 'tecnica' | 'otro';
  contenido: string;
  privado: boolean;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SetupStatus {
  is_configured: boolean;
  has_admin: boolean;
}

// Extended types for API responses with relationships

export interface CuotaWithRelations extends Cuota {
  entrenado?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  pagos?: Pago[];
  total_pagado?: number;
}

export interface SesionEjercicioDisplay {
  id: number;
  sesion_ejercicio_id: number;
  ejercicio_id?: number;
  nombre: string;
  series: number;
  repeticiones?: string | number;
  tiempo?: number;
  intensidad_tipo: string;
  intensidad_valor: number;
  descanso: number;
  observaciones?: string;
  etapa: string;
  video_url?: string;
  superserie_con?: number;
}

export interface SesionDisplay {
  id: number;
  numero: number;
  logica_entrenamiento?: string;
  observaciones?: string;
  ejercicios: SesionEjercicioDisplay[];
  completada?: boolean;
  fecha_completada?: string;
}

export interface MicrocicloDisplay {
  id: number;
  numero: number;
  tipo: string;
  sesiones: SesionDisplay[];
}

export interface MesocicloDisplay {
  id: number;
  numero: number;
  nombre: string;
  objetivo?: string;
  tipo: string;
  microciclos: MicrocicloDisplay[];
}

export interface PlanActivo {
  id: number;
  tipo_plan?: 'simple' | 'complejo';
  nombre?: string;
  objetivo_general?: string;
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  duracion_semanas?: number;
  semana_actual?: number;
  mesociclo_actual?: MesocicloDisplay;
  total_mesociclos: number;
  mesociclos_desbloqueados: number;
  // Simple plan fields
  dias?: DiaSimple[];
}

// Planes simples
export interface DiaEjercicio {
  id: number;
  sesion_ejercicio_id: number;
  ejercicio_id: number;
  ejercicio?: {
    id: number;
    nombre: string;
    descripcion?: string;
    video_url?: string;
    imagen_url?: string;
  };
  orden: number;
  etapa: string;
  series: number;
  repeticiones?: string | number;
  tiempo?: number;
  intensidad_tipo?: string;
  intensidad_valor?: number;
  descanso?: number;
  observaciones?: string;
  superserie_con?: number;
}

export interface DiaSimple {
  id: number;
  numero: number;
  nombre?: string;
  logica_entrenamiento?: string;
  observaciones?: string;
  completada?: boolean;
  ejercicios: DiaEjercicio[];
}

export interface PlanSimple {
  id: number;
  tipo_plan: 'simple';
  nombre: string;
  objetivo_general?: string;
  fecha_inicio: string;
  activo: boolean;
  entrenado_id: number;
  created_at?: string;
  dias: DiaSimple[];
}
