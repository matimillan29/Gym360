import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface Entrenado {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  fecha_nacimiento: string;
  profesion?: string;
  foto?: string;
  estado: 'activo' | 'baja_temporal' | 'inactivo';
  entrenador_asignado_id?: number;
  entrenador_asignado?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  created_at: string;
}

interface Medidas {
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
}

interface Anamnesis {
  id: number;
  // Antropométricos
  peso?: number;
  altura?: number;
  imc?: number;
  medidas?: Medidas;
  // Historial Médico
  lesiones_previas?: string;
  lesiones_actuales?: string;
  cirugias?: string;
  molestias?: string;
  condiciones_medicas?: string;
  medicacion?: string;
  alergias?: string;
  // Historial Deportivo
  experiencia_gym?: string;
  años_entrenamiento?: number;
  deportes?: string;
  frecuencia_actual?: string;
  objetivos_principales?: string;
  objetivos_secundarios?: string;
  icono_objetivo?: string;
  disponibilidad_dias?: number;
  tiempo_por_sesion?: string;
  // Condicionantes
  ejercicios_contraindicados?: string;
  limitaciones_movimiento?: string;
  equipamiento_casa?: string;
  notas?: string;
  updated_at: string;
}

interface PlanCuota {
  id: number;
  nombre: string;
  precio: number;
  duracion_dias: number;
}

interface Cuota {
  id: number;
  plan: PlanCuota;
  fecha_inicio: string;
  fecha_vencimiento: string;
  monto: number;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'mora';
  pagos?: Pago[];
}

interface Pago {
  id: number;
  fecha: string;
  monto: number;
  metodo: string;
  comprobante?: string;
  notas?: string;
}

interface Evaluacion {
  id: number;
  tipo: string;
  nombre: string;
  descripcion?: string;
  valor: number;
  unidad: string;
  fecha: string;
}

interface LinkAdjunto {
  id: number;
  titulo: string;
  url: string;
  descripcion?: string;
  categoria: 'video_tecnica' | 'articulo' | 'recurso' | 'otro';
  created_at: string;
}

interface Feedback {
  id: number;
  tipo: 'progreso' | 'actitud' | 'asistencia' | 'tecnica' | 'otro';
  contenido: string;
  privado: boolean;
  created_at: string;
  entrenador?: {
    nombre: string;
    apellido: string;
  };
}

interface Macrociclo {
  id: number;
  objetivo_general: string;
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  activo: boolean;
  mesociclos_count?: number;
}

interface EstadisticasEntrenado {
  sesiones_totales: number;
  sesiones_completadas: number;
  porcentaje_asistencia: number;
  racha_actual: number;
  mejor_racha: number;
  tonelaje_total: number;
  tonelaje_ultimo_mes: number;
  mejores_marcas: {
    ejercicio_nombre: string;
    peso: number;
    repeticiones: number;
    rm_estimado: number;
    fecha: string;
  }[];
}

const tabs = [
  { id: 'info', label: 'Información' },
  { id: 'anamnesis', label: 'Anamnesis' },
  { id: 'planes', label: 'Planes' },
  { id: 'estadisticas', label: 'Estadísticas' },
  { id: 'evaluaciones', label: 'Evaluaciones' },
  { id: 'cuotas', label: 'Cuotas' },
  { id: 'links', label: 'Links' },
  { id: 'feedback', label: 'Feedback' },
];

export default function EntrenadoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');

  // Anamnesis state
  const [isEditingAnamnesis, setIsEditingAnamnesis] = useState(false);
  const [anamnesisForm, setAnamnesisForm] = useState<Partial<Anamnesis>>({});
  const [anamnesisSection, setAnamnesisSection] = useState<'antropometricos' | 'medico' | 'deportivo' | 'condicionantes'>('antropometricos');

  // Cuotas state
  const [showCuotaModal, setShowCuotaModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState<Cuota | null>(null);
  const [cuotaForm, setCuotaForm] = useState({ plan_id: '', monto: '', fecha_inicio: '' });
  const [pagoForm, setPagoForm] = useState({ monto: '', metodo: 'efectivo', comprobante: '', notas: '' });

  // Evaluaciones state
  const [showEvaluacionModal, setShowEvaluacionModal] = useState(false);
  const [evaluacionForm, setEvaluacionForm] = useState({
    tipo: 'vo2max',
    nombre: '',
    descripcion: '',
    valor: '',
    unidad: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  // Links state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({ titulo: '', url: '', descripcion: '', categoria: 'video_tecnica' });

  // Feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ tipo: 'progreso', contenido: '', privado: false });

  // Estado y asignación state
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [showAsignarModal, setShowAsignarModal] = useState(false);

  // Foto upload
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Fetch entrenado
  const { data: entrenado, isLoading } = useQuery<Entrenado>({
    queryKey: ['entrenado', id],
    queryFn: async () => {
      const response = await api.get(`/entrenados/${id}`);
      return response.data.data || response.data;
    },
  });

  // Fetch anamnesis
  const { data: anamnesis, isLoading: isLoadingAnamnesis } = useQuery<Anamnesis>({
    queryKey: ['anamnesis', id],
    queryFn: async () => {
      const response = await api.get(`/entrenados/${id}/anamnesis`);
      return response.data.data || response.data;
    },
  });

  // Fetch cuotas
  const { data: cuotas = [] } = useQuery<Cuota[]>({
    queryKey: ['cuotas', id],
    queryFn: async () => {
      const response = await api.get(`/entrenados/${id}/cuotas`);
      return response.data.data || response.data || [];
    },
  });

  // Fetch planes de cuota disponibles
  const { data: planesCuota = [] } = useQuery<PlanCuota[]>({
    queryKey: ['planes-cuota'],
    queryFn: async () => {
      const response = await api.get('/planes-cuota');
      return response.data.data || response.data || [];
    },
  });

  // Fetch evaluaciones
  const { data: evaluaciones = [] } = useQuery<Evaluacion[]>({
    queryKey: ['evaluaciones', id],
    queryFn: async () => {
      const response = await api.get(`/entrenados/${id}/evaluaciones`);
      return response.data.data || response.data || [];
    },
  });

  // Fetch links
  const { data: links = [] } = useQuery<LinkAdjunto[]>({
    queryKey: ['links', id],
    queryFn: async () => {
      const response = await api.get(`/entrenados/${id}/links`);
      return response.data.data || response.data || [];
    },
  });

  // Fetch feedback
  const { data: feedbackList = [] } = useQuery<Feedback[]>({
    queryKey: ['feedback', id],
    queryFn: async () => {
      const response = await api.get(`/entrenados/${id}/feedbacks`);
      return response.data.data || response.data || [];
    },
  });

  // Fetch planes (macrociclos)
  const { data: planes = [] } = useQuery<Macrociclo[]>({
    queryKey: ['planes-entrenado', id],
    queryFn: async () => {
      const response = await api.get(`/entrenados/${id}/macrociclos`);
      return response.data.data || response.data || [];
    },
  });

  // Fetch estadísticas
  const { data: estadisticas } = useQuery<EstadisticasEntrenado | null>({
    queryKey: ['estadisticas-entrenado', id],
    queryFn: async () => {
      try {
        const response = await api.get(`/entrenados/${id}/estadisticas`);
        return response.data.data || response.data;
      } catch {
        return null;
      }
    },
    enabled: activeTab === 'estadisticas',
  });

  // Fetch entrenadores para asignación
  const { data: entrenadores = [], isLoading: loadingEntrenadores } = useQuery<{ id: number; nombre: string; apellido: string }[]>({
    queryKey: ['entrenadores-list'],
    queryFn: async () => {
      const response = await api.get('/entrenadores?per_page=100');
      return response.data.data || response.data || [];
    },
    enabled: showAsignarModal,
  });

  // Mutations
  const saveAnamnesisMutation = useMutation({
    mutationFn: async (data: Partial<Anamnesis>) => {
      if (anamnesis?.id) {
        return api.put(`/entrenados/${id}/anamnesis`, data);
      } else {
        return api.post(`/entrenados/${id}/anamnesis`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis', id] });
      setIsEditingAnamnesis(false);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Error al guardar. Intentá nuevamente.');
    },
  });

  const saveCuotaMutation = useMutation({
    mutationFn: async (data: typeof cuotaForm) => {
      return api.post(`/entrenados/${id}/cuotas`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuotas', id] });
      setShowCuotaModal(false);
      setCuotaForm({ plan_id: '', monto: '', fecha_inicio: '' });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Error al guardar. Intentá nuevamente.');
    },
  });

  const savePagoMutation = useMutation({
    mutationFn: async (data: typeof pagoForm) => {
      return api.post(`/cuotas/${selectedCuota?.id}/pagos`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuotas', id] });
      setShowPagoModal(false);
      setSelectedCuota(null);
      setPagoForm({ monto: '', metodo: 'efectivo', comprobante: '', notas: '' });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Error al guardar. Intentá nuevamente.');
    },
  });

  const saveEvaluacionMutation = useMutation({
    mutationFn: async (data: typeof evaluacionForm) => {
      return api.post(`/entrenados/${id}/evaluaciones`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluaciones', id] });
      setShowEvaluacionModal(false);
      setEvaluacionForm({
        tipo: 'fuerza_maxima',
        nombre: '',
        descripcion: '',
        valor: '',
        unidad: 'kg',
        fecha: new Date().toISOString().split('T')[0]
      });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Error al guardar. Intentá nuevamente.');
    },
  });

  const saveLinkMutation = useMutation({
    mutationFn: async (data: typeof linkForm) => {
      return api.post(`/entrenados/${id}/links`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', id] });
      setShowLinkModal(false);
      setLinkForm({ titulo: '', url: '', descripcion: '', categoria: 'video_tecnica' });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Error al guardar. Intentá nuevamente.');
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      return api.delete(`/links/${linkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', id] });
    },
  });

  const saveFeedbackMutation = useMutation({
    mutationFn: async (data: typeof feedbackForm) => {
      return api.post(`/entrenados/${id}/feedbacks`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', id] });
      setShowFeedbackModal(false);
      setFeedbackForm({ tipo: 'progreso', contenido: '', privado: false });
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Error al guardar. Intentá nuevamente.');
    },
  });

  const cambiarEstadoMutation = useMutation({
    mutationFn: async (nuevoEstado: 'activo' | 'baja_temporal' | 'inactivo') => {
      if (nuevoEstado === 'baja_temporal') {
        return api.post(`/entrenados/${id}/baja-temporal`);
      } else if (nuevoEstado === 'activo') {
        return api.post(`/entrenados/${id}/reactivar`);
      } else {
        return api.put(`/entrenados/${id}`, { estado: nuevoEstado });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entrenado', id] });
      queryClient.invalidateQueries({ queryKey: ['entrenados'] });
      setShowEstadoModal(false);
    },
  });

  const asignarEntrenadorMutation = useMutation({
    mutationFn: async (entrenadorId: number) => {
      return api.post(`/entrenados/${id}/asignar-entrenador`, { entrenador_id: entrenadorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entrenado', id] });
      queryClient.invalidateQueries({ queryKey: ['entrenados'] });
      setShowAsignarModal(false);
    },
    onError: (error) => {
      console.error('Error al asignar entrenador:', error);
      alert('Error al asignar entrenador. Por favor, intenta nuevamente.');
    },
  });

  // Handler para subir foto
  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append('foto', file);
      await api.post(`/entrenados/${id}/foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['entrenado', id] });
      queryClient.invalidateQueries({ queryKey: ['entrenados'] });
    } catch (error) {
      console.error('Error al subir foto:', error);
    } finally {
      setUploadingFoto(false);
      if (fotoInputRef.current) {
        fotoInputRef.current.value = '';
      }
    }
  };

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const calcularIMC = (peso?: number, altura?: number) => {
    if (!peso || !altura) return null;
    return (peso / Math.pow(altura / 100, 2)).toFixed(1);
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      activo: 'bg-green-100 text-green-800',
      baja_temporal: 'bg-yellow-100 text-yellow-800',
      inactivo: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      activo: 'Activo',
      baja_temporal: 'Baja temporal',
      inactivo: 'Inactivo',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[estado]}`}>
        {labels[estado]}
      </span>
    );
  };

  const getCuotaEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      pagado: 'bg-green-100 text-green-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      vencido: 'bg-orange-100 text-orange-800',
      mora: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[estado]}`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const getLinkCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      video_tecnica: 'Video Técnica',
      articulo: 'Artículo',
      recurso: 'Recurso',
      otro: 'Otro'
    };
    return labels[categoria] || categoria;
  };

  const getFeedbackTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      progreso: 'Progreso',
      actitud: 'Actitud',
      asistencia: 'Asistencia',
      tecnica: 'Técnica',
      otro: 'Otro'
    };
    return labels[tipo] || tipo;
  };

  const updateMedidas = (field: keyof Medidas, value: string) => {
    setAnamnesisForm({
      ...anamnesisForm,
      medidas: {
        ...anamnesisForm.medidas,
        [field]: value ? parseFloat(value) : undefined
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando entrenado...</p>
      </div>
    );
  }

  if (!entrenado) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Entrenado no encontrado</p>
        <button
          onClick={() => navigate('/entrenador/entrenados')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-sm">
        <button
          onClick={() => navigate('/entrenador/entrenados')}
          className="flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a entrenados
        </button>

        <div className="flex items-start gap-6">
          {/* Foto con opción de subir */}
          <div className="relative flex-shrink-0">
            <div
              onClick={() => fotoInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold cursor-pointer group overflow-hidden"
            >
              {entrenado.foto ? (
                <img src={entrenado.foto} alt="" className="w-full h-full object-cover" />
              ) : (
                `${entrenado.nombre[0]}${entrenado.apellido[0]}`
              )}
              {/* Overlay para subir foto */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingFoto ? (
                  <svg className="w-8 h-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            </div>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold">
                {entrenado.nombre} {entrenado.apellido}
              </h1>
              {getEstadoBadge(entrenado.estado)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-blue-100">
              <div>
                <p className="text-sm opacity-75">Email</p>
                <p className="font-medium truncate">{entrenado.email}</p>
              </div>
              <div>
                <p className="text-sm opacity-75">Teléfono</p>
                <p className="font-medium">{entrenado.telefono}</p>
              </div>
              <div>
                <p className="text-sm opacity-75">DNI</p>
                <p className="font-medium">{entrenado.dni}</p>
              </div>
              <div>
                <p className="text-sm opacity-75">Edad</p>
                <p className="font-medium">{calcularEdad(entrenado.fecha_nacimiento)} años</p>
              </div>
            </div>

            {/* Entrenador asignado y acciones */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2 text-blue-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm">
                  Entrenador: {entrenado.entrenador_asignado ? `${entrenado.entrenador_asignado.nombre} ${entrenado.entrenador_asignado.apellido}` : 'Sin asignar'}
                </span>
              </div>
              <div className="flex-1" />
              <button
                onClick={() => setShowAsignarModal(true)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                Cambiar entrenador
              </button>
              <button
                onClick={() => setShowEstadoModal(true)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                Cambiar estado
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 lg:gap-8 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Nombre completo</label>
                  <p className="font-medium">{entrenado.nombre} {entrenado.apellido}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{entrenado.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Teléfono</label>
                  <p className="font-medium">{entrenado.telefono}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">DNI</label>
                  <p className="font-medium">{entrenado.dni}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Fecha de nacimiento</label>
                  <p className="font-medium">
                    {new Date(entrenado.fecha_nacimiento).toLocaleDateString('es-AR')} ({calcularEdad(entrenado.fecha_nacimiento)} años)
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Profesión</label>
                  <p className="font-medium">{entrenado.profesion || 'No especificada'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Entrenador asignado</label>
                  <p className="font-medium">
                    {entrenado.entrenador_asignado
                      ? `${entrenado.entrenador_asignado.nombre} ${entrenado.entrenador_asignado.apellido}`
                      : 'Sin asignar'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Miembro desde</label>
                  <p className="font-medium">
                    {new Date(entrenado.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anamnesis Tab - Completa */}
        {activeTab === 'anamnesis' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Anamnesis Deportiva</h3>
              <button
                onClick={() => {
                  if (isEditingAnamnesis) {
                    setIsEditingAnamnesis(false);
                  } else {
                    setAnamnesisForm(anamnesis || {});
                    setIsEditingAnamnesis(true);
                    setAnamnesisSection('antropometricos');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditingAnamnesis ? 'Cancelar' : (anamnesis ? 'Editar' : 'Crear')}
              </button>
            </div>

            {isLoadingAnamnesis ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Cargando anamnesis...</p>
              </div>
            ) : isEditingAnamnesis ? (
              <div className="space-y-6">
                {/* Section Tabs */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'antropometricos', label: 'Antropométricos' },
                    { id: 'medico', label: 'Historial Médico' },
                    { id: 'deportivo', label: 'Historial Deportivo' },
                    { id: 'condicionantes', label: 'Condicionantes' }
                  ].map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setAnamnesisSection(section.id as typeof anamnesisSection)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        anamnesisSection === section.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveAnamnesisMutation.mutate(anamnesisForm);
                  }}
                  className="space-y-6"
                >
                  {/* Datos Antropométricos */}
                  {anamnesisSection === 'antropometricos' && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Datos Básicos</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Peso (kg)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={anamnesisForm.peso || ''}
                              onChange={(e) => setAnamnesisForm({ ...anamnesisForm, peso: parseFloat(e.target.value) || undefined })}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Altura (cm)</label>
                            <input
                              type="number"
                              value={anamnesisForm.altura || ''}
                              onChange={(e) => setAnamnesisForm({ ...anamnesisForm, altura: parseFloat(e.target.value) || undefined })}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">IMC</label>
                            <input
                              type="text"
                              value={calcularIMC(anamnesisForm.peso, anamnesisForm.altura) || '-'}
                              disabled
                              className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Medidas Corporales (cm)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Hombros</label>
                            <input
                              type="number"
                              step="0.1"
                              value={anamnesisForm.medidas?.hombros || ''}
                              onChange={(e) => updateMedidas('hombros', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Tórax</label>
                            <input
                              type="number"
                              step="0.1"
                              value={anamnesisForm.medidas?.torax || ''}
                              onChange={(e) => updateMedidas('torax', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Cintura</label>
                            <input
                              type="number"
                              step="0.1"
                              value={anamnesisForm.medidas?.cintura || ''}
                              onChange={(e) => updateMedidas('cintura', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Cadera</label>
                            <input
                              type="number"
                              step="0.1"
                              value={anamnesisForm.medidas?.cadera || ''}
                              onChange={(e) => updateMedidas('cadera', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Muslo derecho</label>
                            <input
                              type="number"
                              step="0.1"
                              value={anamnesisForm.medidas?.muslo_derecho || ''}
                              onChange={(e) => updateMedidas('muslo_derecho', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Muslo izquierdo</label>
                            <input
                              type="number"
                              step="0.1"
                              value={anamnesisForm.medidas?.muslo_izquierdo || ''}
                              onChange={(e) => updateMedidas('muslo_izquierdo', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Gemelo derecho</label>
                            <input
                              type="number"
                              step="0.1"
                              value={anamnesisForm.medidas?.gemelo_derecho || ''}
                              onChange={(e) => updateMedidas('gemelo_derecho', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Gemelo izquierdo</label>
                            <input
                              type="number"
                              step="0.1"
                              value={anamnesisForm.medidas?.gemelo_izquierdo || ''}
                              onChange={(e) => updateMedidas('gemelo_izquierdo', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Brazo derecho</label>
                            <input
                              type="number"
                              step="0.1"
                              value={anamnesisForm.medidas?.brazo_derecho || ''}
                              onChange={(e) => updateMedidas('brazo_derecho', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Brazo izquierdo</label>
                            <input
                              type="number"
                              step="0.1"
                              value={anamnesisForm.medidas?.brazo_izquierdo || ''}
                              onChange={(e) => updateMedidas('brazo_izquierdo', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Historial Médico */}
                  {anamnesisSection === 'medico' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Lesiones previas</label>
                        <textarea
                          value={anamnesisForm.lesiones_previas || ''}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, lesiones_previas: e.target.value })}
                          rows={3}
                          placeholder="Describí lesiones anteriores..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Lesiones actuales</label>
                        <textarea
                          value={anamnesisForm.lesiones_actuales || ''}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, lesiones_actuales: e.target.value })}
                          rows={3}
                          placeholder="Lesiones o molestias actuales..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Cirugías</label>
                        <textarea
                          value={anamnesisForm.cirugias || ''}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, cirugias: e.target.value })}
                          rows={3}
                          placeholder="Intervenciones quirúrgicas..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Molestias / Dolores</label>
                        <textarea
                          value={anamnesisForm.molestias || ''}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, molestias: e.target.value })}
                          rows={3}
                          placeholder="Dolores o molestias frecuentes..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Condiciones médicas</label>
                        <textarea
                          value={anamnesisForm.condiciones_medicas || ''}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, condiciones_medicas: e.target.value })}
                          rows={3}
                          placeholder="Hipertensión, diabetes, etc..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Medicación actual</label>
                        <textarea
                          value={anamnesisForm.medicacion || ''}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, medicacion: e.target.value })}
                          rows={3}
                          placeholder="Medicamentos que toma regularmente..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Alergias</label>
                        <textarea
                          value={anamnesisForm.alergias || ''}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, alergias: e.target.value })}
                          rows={2}
                          placeholder="Alergias conocidas..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Historial Deportivo */}
                  {anamnesisSection === 'deportivo' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Experiencia en gimnasio</label>
                          <select
                            value={anamnesisForm.experiencia_gym || ''}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, experiencia_gym: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="ninguna">Ninguna</option>
                            <option value="principiante">Principiante (menos de 1 año)</option>
                            <option value="intermedio">Intermedio (1-3 años)</option>
                            <option value="avanzado">Avanzado (más de 3 años)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Años de entrenamiento</label>
                          <input
                            type="number"
                            min="0"
                            value={anamnesisForm.años_entrenamiento || ''}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, años_entrenamiento: parseInt(e.target.value) || undefined })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Frecuencia actual de actividad</label>
                          <select
                            value={anamnesisForm.frecuencia_actual || ''}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, frecuencia_actual: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="sedentario">Sedentario (sin actividad)</option>
                            <option value="ocasional">Ocasional (1-2 veces/semana)</option>
                            <option value="regular">Regular (3-4 veces/semana)</option>
                            <option value="frecuente">Frecuente (5+ veces/semana)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Disponibilidad (días/semana)</label>
                          <input
                            type="number"
                            min="1"
                            max="7"
                            value={anamnesisForm.disponibilidad_dias || ''}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, disponibilidad_dias: parseInt(e.target.value) || undefined })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Tiempo disponible por sesión</label>
                          <select
                            value={anamnesisForm.tiempo_por_sesion || ''}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, tiempo_por_sesion: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="30min">30 minutos</option>
                            <option value="45min">45 minutos</option>
                            <option value="60min">1 hora</option>
                            <option value="90min">1 hora 30 minutos</option>
                            <option value="120min">2 horas o más</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Deportes practicados</label>
                        <textarea
                          value={anamnesisForm.deportes || ''}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, deportes: e.target.value })}
                          rows={2}
                          placeholder="Deportes que practica o practicó..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Objetivos principales</label>
                          <textarea
                            value={anamnesisForm.objetivos_principales || ''}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, objetivos_principales: e.target.value })}
                            rows={3}
                            placeholder="¿Qué quiere lograr principalmente?"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Objetivos secundarios</label>
                          <textarea
                            value={anamnesisForm.objetivos_secundarios || ''}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, objetivos_secundarios: e.target.value })}
                            rows={3}
                            placeholder="Objetivos adicionales..."
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Icono de objetivo */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Icono de objetivo (visible en lista)</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: 'pesa', label: 'Pesa', emoji: '🏋️' },
                            { id: 'correr', label: 'Correr', emoji: '🏃' },
                            { id: 'futbol', label: 'Fútbol', emoji: '⚽' },
                            { id: 'volleyball', label: 'Vóley', emoji: '🏐' },
                            { id: 'tenis', label: 'Tenis', emoji: '🎾' },
                            { id: 'natacion', label: 'Natación', emoji: '🏊' },
                            { id: 'ciclismo', label: 'Ciclismo', emoji: '🚴' },
                            { id: 'yoga', label: 'Yoga', emoji: '🧘' },
                            { id: 'boxeo', label: 'Boxeo', emoji: '🥊' },
                            { id: 'baloncesto', label: 'Básquet', emoji: '🏀' },
                            { id: 'rugby', label: 'Rugby', emoji: '🏉' },
                            { id: 'escalada', label: 'Escalada', emoji: '🧗' },
                            { id: 'bajar_peso', label: 'Bajar peso', emoji: '⬇️' },
                            { id: 'musculo', label: 'Músculo', emoji: '💪' },
                            { id: 'salud', label: 'Salud', emoji: '❤️' },
                            { id: 'flexibilidad', label: 'Flexibilidad', emoji: '🤸' },
                          ].map((icon) => (
                            <button
                              key={icon.id}
                              type="button"
                              onClick={() => setAnamnesisForm({ ...anamnesisForm, icono_objetivo: icon.id })}
                              className={`flex items-center gap-1 px-3 py-2 rounded-lg border-2 transition-colors ${
                                anamnesisForm.icono_objetivo === icon.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              title={icon.label}
                            >
                              <span className="text-xl">{icon.emoji}</span>
                              <span className="text-sm text-gray-600">{icon.label}</span>
                            </button>
                          ))}
                          {anamnesisForm.icono_objetivo && (
                            <button
                              type="button"
                              onClick={() => setAnamnesisForm({ ...anamnesisForm, icono_objetivo: undefined })}
                              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              Quitar icono
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Condicionantes */}
                  {anamnesisSection === 'condicionantes' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Ejercicios contraindicados</label>
                        <textarea
                          value={anamnesisForm.ejercicios_contraindicados || ''}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, ejercicios_contraindicados: e.target.value })}
                          rows={3}
                          placeholder="Ejercicios que no puede realizar..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Limitaciones de movimiento</label>
                        <textarea
                          value={anamnesisForm.limitaciones_movimiento || ''}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, limitaciones_movimiento: e.target.value })}
                          rows={3}
                          placeholder="Restricciones de movilidad..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Equipamiento disponible en casa</label>
                        <textarea
                          value={anamnesisForm.equipamiento_casa || ''}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, equipamiento_casa: e.target.value })}
                          rows={2}
                          placeholder="Si entrena en casa, ¿qué equipamiento tiene?"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Notas adicionales</label>
                        <textarea
                          value={anamnesisForm.notas || ''}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, notas: e.target.value })}
                          rows={3}
                          placeholder="Cualquier otra información relevante..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setIsEditingAnamnesis(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saveAnamnesisMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saveAnamnesisMutation.isPending ? 'Guardando...' : 'Guardar Anamnesis'}
                    </button>
                  </div>
                </form>
              </div>
            ) : anamnesis ? (
              <div className="space-y-8">
                {/* Datos Antropométricos */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Datos Antropométricos
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-600">Peso</p>
                      <p className="text-xl font-semibold text-blue-900">{anamnesis.peso || '-'} kg</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-600">Altura</p>
                      <p className="text-xl font-semibold text-blue-900">{anamnesis.altura || '-'} cm</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-600">IMC</p>
                      <p className="text-xl font-semibold text-blue-900">
                        {calcularIMC(anamnesis.peso, anamnesis.altura) || '-'}
                      </p>
                    </div>
                  </div>

                  {anamnesis.medidas && Object.values(anamnesis.medidas).some(v => v) && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Medidas corporales (cm)</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {anamnesis.medidas.hombros && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Hombros</p>
                            <p className="font-semibold">{anamnesis.medidas.hombros}</p>
                          </div>
                        )}
                        {anamnesis.medidas.torax && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Tórax</p>
                            <p className="font-semibold">{anamnesis.medidas.torax}</p>
                          </div>
                        )}
                        {anamnesis.medidas.cintura && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Cintura</p>
                            <p className="font-semibold">{anamnesis.medidas.cintura}</p>
                          </div>
                        )}
                        {anamnesis.medidas.cadera && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Cadera</p>
                            <p className="font-semibold">{anamnesis.medidas.cadera}</p>
                          </div>
                        )}
                        {anamnesis.medidas.brazo_derecho && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Brazo Der.</p>
                            <p className="font-semibold">{anamnesis.medidas.brazo_derecho}</p>
                          </div>
                        )}
                        {anamnesis.medidas.brazo_izquierdo && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Brazo Izq.</p>
                            <p className="font-semibold">{anamnesis.medidas.brazo_izquierdo}</p>
                          </div>
                        )}
                        {anamnesis.medidas.muslo_derecho && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Muslo Der.</p>
                            <p className="font-semibold">{anamnesis.medidas.muslo_derecho}</p>
                          </div>
                        )}
                        {anamnesis.medidas.muslo_izquierdo && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Muslo Izq.</p>
                            <p className="font-semibold">{anamnesis.medidas.muslo_izquierdo}</p>
                          </div>
                        )}
                        {anamnesis.medidas.gemelo_derecho && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Gemelo Der.</p>
                            <p className="font-semibold">{anamnesis.medidas.gemelo_derecho}</p>
                          </div>
                        )}
                        {anamnesis.medidas.gemelo_izquierdo && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500">Gemelo Izq.</p>
                            <p className="font-semibold">{anamnesis.medidas.gemelo_izquierdo}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Historial Médico */}
                {(anamnesis.lesiones_previas || anamnesis.lesiones_actuales || anamnesis.cirugias ||
                  anamnesis.molestias || anamnesis.condiciones_medicas || anamnesis.medicacion || anamnesis.alergias) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Historial Médico
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {anamnesis.lesiones_previas && (
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-sm text-red-600 font-medium">Lesiones previas</p>
                          <p className="mt-1 text-gray-700">{anamnesis.lesiones_previas}</p>
                        </div>
                      )}
                      {anamnesis.lesiones_actuales && (
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-sm text-red-600 font-medium">Lesiones actuales</p>
                          <p className="mt-1 text-gray-700">{anamnesis.lesiones_actuales}</p>
                        </div>
                      )}
                      {anamnesis.cirugias && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600 font-medium">Cirugías</p>
                          <p className="mt-1 text-gray-700">{anamnesis.cirugias}</p>
                        </div>
                      )}
                      {anamnesis.molestias && (
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <p className="text-sm text-yellow-700 font-medium">Molestias / Dolores</p>
                          <p className="mt-1 text-gray-700">{anamnesis.molestias}</p>
                        </div>
                      )}
                      {anamnesis.condiciones_medicas && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600 font-medium">Condiciones médicas</p>
                          <p className="mt-1 text-gray-700">{anamnesis.condiciones_medicas}</p>
                        </div>
                      )}
                      {anamnesis.medicacion && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600 font-medium">Medicación</p>
                          <p className="mt-1 text-gray-700">{anamnesis.medicacion}</p>
                        </div>
                      )}
                      {anamnesis.alergias && (
                        <div className="bg-orange-50 rounded-lg p-3 md:col-span-2">
                          <p className="text-sm text-orange-700 font-medium">Alergias</p>
                          <p className="mt-1 text-gray-700">{anamnesis.alergias}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Historial Deportivo */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Historial Deportivo
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-green-600">Experiencia</p>
                      <p className="font-semibold text-green-900 capitalize">{anamnesis.experiencia_gym || '-'}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-green-600">Años entrenando</p>
                      <p className="font-semibold text-green-900">{anamnesis.años_entrenamiento || '-'}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-green-600">Disponibilidad</p>
                      <p className="font-semibold text-green-900">{anamnesis.disponibilidad_dias || '-'} días/sem</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-green-600">Tiempo/sesión</p>
                      <p className="font-semibold text-green-900">{anamnesis.tiempo_por_sesion || '-'}</p>
                    </div>
                  </div>

                  {anamnesis.deportes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-600 font-medium">Deportes practicados</p>
                      <p className="mt-1">{anamnesis.deportes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {anamnesis.objetivos_principales && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-600 font-medium">Objetivos principales</p>
                        <p className="mt-1 text-gray-700">{anamnesis.objetivos_principales}</p>
                      </div>
                    )}
                    {anamnesis.objetivos_secundarios && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 font-medium">Objetivos secundarios</p>
                        <p className="mt-1 text-gray-700">{anamnesis.objetivos_secundarios}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Condicionantes */}
                {(anamnesis.ejercicios_contraindicados || anamnesis.limitaciones_movimiento ||
                  anamnesis.equipamiento_casa || anamnesis.notas) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Condicionantes
                    </h4>
                    <div className="space-y-3">
                      {anamnesis.ejercicios_contraindicados && (
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-sm text-red-600 font-medium">Ejercicios contraindicados</p>
                          <p className="mt-1 text-gray-700">{anamnesis.ejercicios_contraindicados}</p>
                        </div>
                      )}
                      {anamnesis.limitaciones_movimiento && (
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <p className="text-sm text-yellow-700 font-medium">Limitaciones de movimiento</p>
                          <p className="mt-1 text-gray-700">{anamnesis.limitaciones_movimiento}</p>
                        </div>
                      )}
                      {anamnesis.equipamiento_casa && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600 font-medium">Equipamiento en casa</p>
                          <p className="mt-1 text-gray-700">{anamnesis.equipamiento_casa}</p>
                        </div>
                      )}
                      {anamnesis.notas && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600 font-medium">Notas adicionales</p>
                          <p className="mt-1 text-gray-700">{anamnesis.notas}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-400">
                  Última actualización: {new Date(anamnesis.updated_at).toLocaleDateString('es-AR')}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No hay anamnesis registrada</p>
                <p className="text-sm text-gray-400 mt-1">Hacé clic en "Crear" para agregar la anamnesis</p>
              </div>
            )}
          </div>
        )}

        {/* Planes Tab */}
        {activeTab === 'planes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Planes de Entrenamiento</h3>
              <button
                onClick={() => navigate(`/entrenador/planes/nuevo?entrenado=${id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nuevo Plan
              </button>
            </div>

            {planes.length > 0 ? (
              <div className="space-y-3">
                {planes.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border rounded-xl p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      plan.activo ? 'border-green-200 bg-green-50/50' : ''
                    }`}
                    onClick={() => navigate(`/entrenador/planes/${plan.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{plan.objetivo_general}</h4>
                          {plan.activo && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Activo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Inicio: {new Date(plan.fecha_inicio).toLocaleDateString('es-AR')}</span>
                          {plan.fecha_fin_estimada && (
                            <span>Fin estimado: {new Date(plan.fecha_fin_estimada).toLocaleDateString('es-AR')}</span>
                          )}
                          {plan.mesociclos_count !== undefined && (
                            <span>{plan.mesociclos_count} mesociclos</span>
                          )}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">No hay planes de entrenamiento</p>
                <p className="text-sm text-gray-400 mt-1">Creá un nuevo plan para este entrenado</p>
              </div>
            )}
          </div>
        )}

        {/* Estadísticas Tab */}
        {activeTab === 'estadisticas' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Estadísticas de Entrenamiento</h3>

            {estadisticas ? (
              <>
                {/* Cards de resumen */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 border">
                    <p className="text-xs text-gray-500">Asistencia</p>
                    <p className="text-2xl font-bold text-gray-900">{estadisticas.porcentaje_asistencia}%</p>
                    <p className="text-xs text-gray-400">
                      {estadisticas.sesiones_completadas}/{estadisticas.sesiones_totales} sesiones
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border">
                    <p className="text-xs text-gray-500">Racha actual</p>
                    <p className="text-2xl font-bold text-orange-600">{estadisticas.racha_actual}</p>
                    <p className="text-xs text-gray-400">Mejor: {estadisticas.mejor_racha}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border">
                    <p className="text-xs text-gray-500">Tonelaje total</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(estadisticas.tonelaje_total / 1000).toFixed(1)}t
                    </p>
                    <p className="text-xs text-gray-400">kg levantados</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border">
                    <p className="text-xs text-gray-500">Este mes</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(estadisticas.tonelaje_ultimo_mes / 1000).toFixed(1)}t
                    </p>
                    <p className="text-xs text-gray-400">tonelaje mensual</p>
                  </div>
                </div>

                {/* Barra de asistencia */}
                <div className="bg-white rounded-xl p-6 border">
                  <h4 className="font-medium text-gray-900 mb-3">Progreso de asistencia</h4>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${estadisticas.porcentaje_asistencia}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>0%</span>
                    <span>{estadisticas.porcentaje_asistencia}% completado</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Mejores marcas */}
                <div className="bg-white rounded-xl border">
                  <div className="p-4 border-b">
                    <h4 className="font-medium text-gray-900">Mejores marcas</h4>
                  </div>
                  {estadisticas.mejores_marcas && estadisticas.mejores_marcas.length > 0 ? (
                    <div className="divide-y">
                      {estadisticas.mejores_marcas.map((marca, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{marca.ejercicio_nombre}</p>
                            <p className="text-sm text-gray-500">
                              {marca.peso}kg × {marca.repeticiones} reps
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">1RM: {marca.rm_estimado.toFixed(1)}kg</p>
                            <p className="text-xs text-gray-400">
                              {new Date(marca.fecha).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>No hay registros de marcas aún</p>
                      <p className="text-sm">Las marcas aparecerán cuando el entrenado complete sesiones</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500">No hay estadísticas disponibles</p>
                <p className="text-sm text-gray-400 mt-1">Las estadísticas aparecerán cuando el entrenado complete sesiones</p>
              </div>
            )}
          </div>
        )}

        {/* Evaluaciones Tab */}
        {activeTab === 'evaluaciones' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Evaluaciones de Rendimiento</h3>
              <button
                onClick={() => setShowEvaluacionModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nueva Evaluación
              </button>
            </div>

            {evaluaciones.length > 0 ? (
              <div className="space-y-3">
                {evaluaciones.map((evaluacion) => (
                  <div key={evaluacion.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{evaluacion.nombre}</h4>
                        <p className="text-sm text-gray-500 capitalize">{evaluacion.tipo.replace('_', ' ')}</p>
                        {evaluacion.descripcion && (
                          <p className="text-sm text-gray-400 mt-1">{evaluacion.descripcion}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold text-blue-600">
                          {evaluacion.valor} {evaluacion.unidad}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(evaluacion.fecha).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500">No hay evaluaciones registradas</p>
              </div>
            )}
          </div>
        )}

        {/* Cuotas Tab */}
        {activeTab === 'cuotas' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Cuotas y Pagos</h3>
              <button
                onClick={() => setShowCuotaModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nueva Cuota
              </button>
            </div>

            {cuotas.length > 0 ? (
              <div className="space-y-4">
                {cuotas.map((cuota) => (
                  <div key={cuota.id} className="border rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{cuota.plan?.nombre}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(cuota.fecha_inicio).toLocaleDateString('es-AR')} - {new Date(cuota.fecha_vencimiento).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold">${cuota.monto.toLocaleString()}</p>
                        {getCuotaEstadoBadge(cuota.estado)}
                      </div>
                    </div>

                    {cuota.pagos && cuota.pagos.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-sm font-medium text-gray-600 mb-2">Pagos registrados:</p>
                        <div className="space-y-2">
                          {cuota.pagos.map((pago) => (
                            <div key={pago.id} className="flex justify-between items-center text-sm bg-green-50 rounded-lg px-3 py-2">
                              <div>
                                <span className="font-medium">${pago.monto.toLocaleString()}</span>
                                <span className="text-gray-500 ml-2">({pago.metodo})</span>
                              </div>
                              <span className="text-gray-500">{new Date(pago.fecha).toLocaleDateString('es-AR')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {cuota.estado !== 'pagado' && (
                      <button
                        onClick={() => {
                          setSelectedCuota(cuota);
                          setPagoForm({ monto: cuota.monto.toString(), metodo: 'efectivo', comprobante: '', notas: '' });
                          setShowPagoModal(true);
                        }}
                        className="mt-3 text-blue-600 hover:underline text-sm font-medium"
                      >
                        + Registrar pago
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500">No hay cuotas registradas</p>
              </div>
            )}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Links Adjuntos</h3>
              <button
                onClick={() => setShowLinkModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar Link
              </button>
            </div>

            {links.length > 0 ? (
              <div className="space-y-3">
                {links.map((link) => (
                  <div key={link.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {link.titulo}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {getLinkCategoriaLabel(link.categoria)}
                          </span>
                        </div>
                        {link.descripcion && (
                          <p className="text-sm text-gray-500 mt-1">{link.descripcion}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Agregado el {new Date(link.created_at).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar este link?')) {
                            deleteLinkMutation.mutate(link.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="text-gray-500">No hay links adjuntos</p>
                <p className="text-sm text-gray-400 mt-1">Agregá videos, artículos o recursos para este entrenado</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Feedback del Entrenador</h3>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar Feedback
              </button>
            </div>

            {feedbackList.length > 0 ? (
              <div className="space-y-3">
                {feedbackList.map((fb) => (
                  <div key={fb.id} className={`border rounded-lg p-4 ${fb.privado ? 'bg-yellow-50 border-yellow-200' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          fb.tipo === 'progreso' ? 'bg-green-100 text-green-700' :
                          fb.tipo === 'tecnica' ? 'bg-blue-100 text-blue-700' :
                          fb.tipo === 'asistencia' ? 'bg-yellow-100 text-yellow-700' :
                          fb.tipo === 'actitud' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {getFeedbackTipoLabel(fb.tipo)}
                        </span>
                        {fb.privado && (
                          <span className="flex items-center gap-1 text-xs text-yellow-700">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Privado
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(fb.created_at).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    <p className="text-gray-700">{fb.contenido}</p>
                    {fb.entrenador && (
                      <p className="text-xs text-gray-400 mt-2">
                        Por {fb.entrenador.nombre} {fb.entrenador.apellido}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-gray-500">No hay feedback registrado</p>
                <p className="text-sm text-gray-400 mt-1">Agregá comentarios sobre el progreso del entrenado</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Nueva Cuota */}
      {showCuotaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Nueva Cuota</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              saveCuotaMutation.mutate(cuotaForm);
            }} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Plan de cuota</label>
                <select
                  value={cuotaForm.plan_id}
                  onChange={(e) => {
                    const planId = e.target.value;
                    const planSeleccionado = planesCuota.find(p => p.id.toString() === planId);
                    setCuotaForm({
                      ...cuotaForm,
                      plan_id: planId,
                      monto: planSeleccionado ? planSeleccionado.precio.toString() : ''
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar plan...</option>
                  {planesCuota.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.nombre} - ${plan.precio.toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Monto</label>
                <input
                  type="number"
                  value={cuotaForm.monto}
                  onChange={(e) => setCuotaForm({ ...cuotaForm, monto: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha de inicio</label>
                <input
                  type="date"
                  value={cuotaForm.fecha_inicio}
                  onChange={(e) => setCuotaForm({ ...cuotaForm, fecha_inicio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCuotaModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveCuotaMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveCuotaMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Pago */}
      {showPagoModal && selectedCuota && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Registrar Pago</h3>
            <p className="text-sm text-gray-500 mb-4">
              Cuota: {selectedCuota.plan?.nombre} - ${selectedCuota.monto.toLocaleString()}
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              savePagoMutation.mutate(pagoForm);
            }} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Monto</label>
                <input
                  type="number"
                  value={pagoForm.monto}
                  onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Método de pago</label>
                <select
                  value={pagoForm.metodo}
                  onChange={(e) => setPagoForm({ ...pagoForm, metodo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="debito">Débito</option>
                  <option value="credito">Crédito</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Comprobante (opcional)</label>
                <input
                  type="text"
                  value={pagoForm.comprobante}
                  onChange={(e) => setPagoForm({ ...pagoForm, comprobante: e.target.value })}
                  placeholder="Número de comprobante..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Notas (opcional)</label>
                <textarea
                  value={pagoForm.notas}
                  onChange={(e) => setPagoForm({ ...pagoForm, notas: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPagoModal(false);
                    setSelectedCuota(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savePagoMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {savePagoMutation.isPending ? 'Guardando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Evaluación */}
      {showEvaluacionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Nueva Evaluación</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              saveEvaluacionMutation.mutate(evaluacionForm);
            }} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tipo de evaluación</label>
                <select
                  value={evaluacionForm.tipo}
                  onChange={(e) => setEvaluacionForm({ ...evaluacionForm, tipo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vo2max">Test de VO2 Max</option>
                  <option value="fuerza">Test de Fuerza</option>
                  <option value="amplitud_movimiento">Test de Amplitud de Movimiento</option>
                  <option value="flexibilidad">Test de Flexibilidad</option>
                  <option value="potencia_aerobica">Test de Potencia Aeróbica</option>
                  <option value="potencia_anaerobica">Test de Potencia Anaeróbica</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input
                  type="text"
                  value={evaluacionForm.nombre}
                  onChange={(e) => setEvaluacionForm({ ...evaluacionForm, nombre: e.target.value })}
                  placeholder="Ej: Press Banca 1RM"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Descripción (opcional)</label>
                <textarea
                  value={evaluacionForm.descripcion}
                  onChange={(e) => setEvaluacionForm({ ...evaluacionForm, descripcion: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Valor</label>
                  <input
                    type="number"
                    step="0.1"
                    value={evaluacionForm.valor}
                    onChange={(e) => setEvaluacionForm({ ...evaluacionForm, valor: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Unidad</label>
                  <select
                    value={evaluacionForm.unidad}
                    onChange={(e) => setEvaluacionForm({ ...evaluacionForm, unidad: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="kg">kg</option>
                    <option value="reps">repeticiones</option>
                    <option value="seg">segundos</option>
                    <option value="min">minutos</option>
                    <option value="m">metros</option>
                    <option value="km">kilómetros</option>
                    <option value="cm">centímetros</option>
                    <option value="nivel">nivel</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                <input
                  type="date"
                  value={evaluacionForm.fecha}
                  onChange={(e) => setEvaluacionForm({ ...evaluacionForm, fecha: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEvaluacionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveEvaluacionMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveEvaluacionMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Link */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Agregar Link</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              saveLinkMutation.mutate(linkForm);
            }} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Título</label>
                <input
                  type="text"
                  value={linkForm.titulo}
                  onChange={(e) => setLinkForm({ ...linkForm, titulo: e.target.value })}
                  placeholder="Nombre del recurso..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">URL</label>
                <input
                  type="url"
                  value={linkForm.url}
                  onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Categoría</label>
                <select
                  value={linkForm.categoria}
                  onChange={(e) => setLinkForm({ ...linkForm, categoria: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="video_tecnica">Video Técnica</option>
                  <option value="articulo">Artículo</option>
                  <option value="recurso">Recurso</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Descripción (opcional)</label>
                <textarea
                  value={linkForm.descripcion}
                  onChange={(e) => setLinkForm({ ...linkForm, descripcion: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveLinkMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveLinkMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Feedback */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Agregar Feedback</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              saveFeedbackMutation.mutate(feedbackForm);
            }} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                <select
                  value={feedbackForm.tipo}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, tipo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="progreso">Progreso</option>
                  <option value="actitud">Actitud</option>
                  <option value="asistencia">Asistencia</option>
                  <option value="tecnica">Técnica</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Comentario</label>
                <textarea
                  value={feedbackForm.contenido}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, contenido: e.target.value })}
                  rows={4}
                  placeholder="Escribí tu feedback..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="privado"
                  checked={feedbackForm.privado}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, privado: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="privado" className="text-sm text-gray-600">
                  Privado (solo visible para entrenadores)
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveFeedbackMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveFeedbackMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Estado */}
      {showEstadoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Cambiar Estado</h2>
              <button
                onClick={() => setShowEstadoModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Estado actual: <span className="font-medium">{entrenado.estado === 'baja_temporal' ? 'Baja temporal' : entrenado.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
              </p>
              <div className="space-y-3">
                {entrenado.estado !== 'activo' && (
                  <button
                    onClick={() => cambiarEstadoMutation.mutate('activo')}
                    disabled={cambiarEstadoMutation.isPending}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="text-left">
                      <p className="font-medium">Activar</p>
                      <p className="text-sm text-green-600">El entrenado podrá acceder normalmente</p>
                    </div>
                  </button>
                )}
                {entrenado.estado !== 'baja_temporal' && (
                  <button
                    onClick={() => cambiarEstadoMutation.mutate('baja_temporal')}
                    disabled={cambiarEstadoMutation.isPending}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-left">
                      <p className="font-medium">Baja temporal</p>
                      <p className="text-sm text-yellow-600">Vacaciones, lesión, etc. Se conservan datos</p>
                    </div>
                  </button>
                )}
                {entrenado.estado !== 'inactivo' && (
                  <button
                    onClick={() => {
                      if (confirm('¿Dar de baja definitiva a este entrenado? No podrá acceder al sistema.')) {
                        cambiarEstadoMutation.mutate('inactivo');
                      }
                    }}
                    disabled={cambiarEstadoMutation.isPending}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <div className="text-left">
                      <p className="font-medium">Dar de baja</p>
                      <p className="text-sm text-red-600">Baja definitiva del sistema</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar Entrenador */}
      {showAsignarModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Asignar Entrenador</h2>
              <button
                onClick={() => setShowAsignarModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Entrenador actual:{' '}
                <span className="font-medium">
                  {entrenado.entrenador_asignado
                    ? `${entrenado.entrenador_asignado.nombre} ${entrenado.entrenador_asignado.apellido}`
                    : 'Sin asignar'}
                </span>
              </p>
              <div className="space-y-2">
                {loadingEntrenadores ? (
                  <p className="text-gray-500 text-center py-4">Cargando entrenadores...</p>
                ) : entrenadores.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay entrenadores disponibles</p>
                ) : (
                  entrenadores.map((ent) => (
                    <button
                      key={ent.id}
                      onClick={() => asignarEntrenadorMutation.mutate(ent.id)}
                      disabled={asignarEntrenadorMutation.isPending || ent.id === entrenado.entrenador_asignado?.id}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors disabled:opacity-50 ${
                        ent.id === entrenado.entrenador_asignado?.id
                          ? 'bg-blue-50 border-2 border-blue-500 text-blue-800'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {ent.nombre.charAt(0)}{ent.apellido.charAt(0)}
                        </span>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">{ent.nombre} {ent.apellido}</p>
                        {ent.id === entrenado.entrenador_asignado?.id && (
                          <p className="text-xs text-blue-600">Asignado actualmente</p>
                        )}
                      </div>
                      {ent.id === entrenado.entrenador_asignado?.id && (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
