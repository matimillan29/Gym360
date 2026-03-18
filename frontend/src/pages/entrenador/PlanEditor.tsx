import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { AxiosError } from 'axios';
import type { Ejercicio } from '../../types';

interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
}

interface SesionEjercicio {
  id?: number;
  ejercicio_id: number;
  ejercicio?: Ejercicio;
  orden: number;
  etapa: string;
  series: number;
  repeticiones?: string;
  tiempo?: number;
  intensidad_tipo: 'rir' | 'rpe' | 'porcentaje';
  intensidad_valor: number;
  descanso: number;
  observaciones?: string;
  superserie_con?: number;
}

interface Sesion {
  id?: number;
  numero: number;
  nombre?: string;
  logica_entrenamiento?: string;
  observaciones?: string;
  ejercicios: SesionEjercicio[];
}

interface Microciclo {
  id?: number;
  numero: number;
  nombre?: string;
  tipo: 'introductorio' | 'desarrollo' | 'estabilizacion' | 'descarga';
  sesiones: Sesion[];
}

interface Mesociclo {
  id?: number;
  numero: number;
  nombre: string;
  objetivo?: string;
  tipo: 'introductorio' | 'desarrollador' | 'estabilizador' | 'recuperacion';
  desbloqueado: boolean;
  microciclos: Microciclo[];
}

interface Macrociclo {
  id?: number;
  entrenado_id: number;
  entrenado?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  nombre: string;
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  objetivo_general: string;
  activo: boolean;
  mesociclos: Mesociclo[];
}

const tiposMesociclo = [
  { value: 'introductorio', label: 'Introductorio' },
  { value: 'desarrollador', label: 'Desarrollador' },
  { value: 'estabilizador', label: 'Estabilizador' },
  { value: 'recuperacion', label: 'Recuperación' },
];

const tiposMicrociclo = [
  { value: 'introductorio', label: 'Introductorio' },
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'estabilizacion', label: 'Estabilización' },
  { value: 'descarga', label: 'Descarga' },
];

export default function PlanEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'nuevo';
  const entrenadoIdFromUrl = searchParams.get('entrenado');

  const [plan, setPlan] = useState<Macrociclo>({
    entrenado_id: entrenadoIdFromUrl ? parseInt(entrenadoIdFromUrl) : 0,
    nombre: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    objetivo_general: '',
    activo: true,
    mesociclos: [],
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPlantillaModal, setShowPlantillaModal] = useState(false);
  const [plantillaForm, setPlantillaForm] = useState({ nombre: '', descripcion: '' });

  const [expandedMesociclo, setExpandedMesociclo] = useState<number | null>(null);
  const [expandedMicrociclo, setExpandedMicrociclo] = useState<string | null>(null);
  const [expandedSesion, setExpandedSesion] = useState<string | null>(null);
  const [showEjercicioModal, setShowEjercicioModal] = useState(false);
  const [ejercicioSearch, setEjercicioSearch] = useState('');

  // Modal para configurar mesociclo
  const [showMesoConfigModal, setShowMesoConfigModal] = useState(false);
  const [mesoConfig, setMesoConfig] = useState({
    nombre: '',
    tipo: 'desarrollador' as Mesociclo['tipo'],
    cantidadMicros: 4,
    sesionesPorMicro: 3,
  });

  // Modal para configurar microciclo
  const [showMicroConfigModal, setShowMicroConfigModal] = useState(false);
  const [microConfig, setMicroConfig] = useState({
    nombre: '',
    tipo: 'desarrollo' as Microciclo['tipo'],
    cantidadSesiones: 3,
    mesoIndex: 0,
  });
  const [editingEjercicio, setEditingEjercicio] = useState<{
    mesociclo: number;
    microciclo: number;
    sesion: number;
    ejercicio: number;
  } | null>(null);
  const [currentSesionPath, setCurrentSesionPath] = useState<{
    mesociclo: number;
    microciclo: number;
    sesion: number;
  } | null>(null);

  // Fetch plan existente
  const { data: planData, isLoading } = useQuery<Macrociclo>({
    queryKey: ['plan', id],
    queryFn: async () => {
      const response = await api.get(`/planes/${id}`);
      return response.data.data || response.data;
    },
    enabled: !isNew && !!id,
  });

  // Fetch entrenado si es nuevo
  const { data: entrenado } = useQuery({
    queryKey: ['entrenado', entrenadoIdFromUrl],
    queryFn: async () => {
      const response = await api.get(`/entrenados/${entrenadoIdFromUrl}`);
      return response.data.data || response.data;
    },
    enabled: isNew && !!entrenadoIdFromUrl,
  });

  // Fetch ejercicios para el selector
  const { data: ejercicios = [] } = useQuery<Ejercicio[]>({
    queryKey: ['ejercicios'],
    queryFn: async () => {
      const response = await api.get('/ejercicios');
      return response.data.data || response.data || [];
    },
  });

  useEffect(() => {
    if (planData) {
      // Formatear fechas para los inputs type="date"
      const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        // Si viene como "2024-12-07T00:00:00.000Z" o similar, extraer solo YYYY-MM-DD
        return dateStr.split('T')[0];
      };

      setPlan({
        ...planData,
        fecha_inicio: formatDate(planData.fecha_inicio),
        fecha_fin_estimada: formatDate(planData.fecha_fin_estimada),
      });
      if (planData.mesociclos?.length > 0) {
        setExpandedMesociclo(0);
      }
    }
  }, [planData]);

  useEffect(() => {
    if (entrenado && isNew) {
      setPlan((prev) => ({
        ...prev,
        entrenado_id: entrenado.id,
        entrenado: entrenado,
      }));
    }
  }, [entrenado, isNew]);

  // Mutation para guardar plan
  const savePlanMutation = useMutation({
    mutationFn: async (data: Macrociclo) => {
      if (isNew) {
        return api.post(`/entrenados/${data.entrenado_id}/macrociclos`, data);
      } else {
        return api.put(`/macrociclos/${id}`, data);
      }
    },
    onSuccess: () => {
      setSaveError(null);
      queryClient.invalidateQueries({ queryKey: ['planes'] });
      navigate('/entrenador/planes');
    },
    onError: (err: AxiosError<ApiError>) => {
      const message = err.response?.data?.message
        || Object.values(err.response?.data?.errors || {})[0]?.[0]
        || 'Error al guardar el plan';
      setSaveError(message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  // Mutation para crear plantilla
  const createPlantillaMutation = useMutation({
    mutationFn: async (data: { nombre: string; descripcion: string; macrociclo_id: number }) => {
      return api.post('/plantillas', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
      setShowPlantillaModal(false);
      setPlantillaForm({ nombre: '', descripcion: '' });
      toast.success('Plantilla creada correctamente');
    },
    onError: (err: AxiosError<ApiError>) => {
      const message = err.response?.data?.message || 'Error al crear la plantilla';
      toast.error(message);
    },
  });

  const handleCreatePlantilla = () => {
    if (!plan.id) {
      toast.error('Primero debes guardar el plan antes de crear una plantilla');
      return;
    }
    createPlantillaMutation.mutate({
      nombre: plantillaForm.nombre,
      descripcion: plantillaForm.descripcion,
      macrociclo_id: plan.id,
    });
  };

  const openMesoConfigModal = () => {
    setMesoConfig({
      nombre: `Mesociclo ${plan.mesociclos.length + 1}`,
      tipo: 'desarrollador',
      cantidadMicros: 4,
      sesionesPorMicro: 3,
    });
    setShowMesoConfigModal(true);
  };

  const addMesociclo = () => {
    // Crear microciclos con sesiones
    const microciclos: Microciclo[] = [];
    for (let i = 0; i < mesoConfig.cantidadMicros; i++) {
      const sesiones: Sesion[] = [];
      for (let j = 0; j < mesoConfig.sesionesPorMicro; j++) {
        sesiones.push({
          numero: j + 1,
          nombre: `Sesión ${j + 1}`,
          ejercicios: [],
        });
      }
      microciclos.push({
        numero: i + 1,
        nombre: `Semana ${i + 1}`,
        tipo: 'desarrollo',
        sesiones,
      });
    }

    const newMesociclo: Mesociclo = {
      numero: plan.mesociclos.length + 1,
      nombre: mesoConfig.nombre,
      tipo: mesoConfig.tipo,
      desbloqueado: plan.mesociclos.length === 0,
      microciclos,
    };
    setPlan({ ...plan, mesociclos: [...plan.mesociclos, newMesociclo] });
    setExpandedMesociclo(plan.mesociclos.length);
    setShowMesoConfigModal(false);
  };

  const openMicroConfigModal = (mesocicloIndex: number) => {
    const meso = plan.mesociclos[mesocicloIndex];
    setMicroConfig({
      nombre: `Semana ${meso.microciclos.length + 1}`,
      tipo: 'desarrollo',
      cantidadSesiones: 3,
      mesoIndex: mesocicloIndex,
    });
    setShowMicroConfigModal(true);
  };

  const addMicrociclo = () => {
    const mesociclos = [...plan.mesociclos];
    const sesiones: Sesion[] = [];
    for (let i = 0; i < microConfig.cantidadSesiones; i++) {
      sesiones.push({
        numero: i + 1,
        nombre: `Sesión ${i + 1}`,
        ejercicios: [],
      });
    }
    const newMicrociclo: Microciclo = {
      numero: mesociclos[microConfig.mesoIndex].microciclos.length + 1,
      nombre: microConfig.nombre,
      tipo: microConfig.tipo,
      sesiones,
    };
    mesociclos[microConfig.mesoIndex].microciclos.push(newMicrociclo);
    setPlan({ ...plan, mesociclos });
    setShowMicroConfigModal(false);
  };

  const addSesion = (mesocicloIndex: number, microcicloIndex: number) => {
    const mesociclos = [...plan.mesociclos];
    const newSesion: Sesion = {
      numero: mesociclos[mesocicloIndex].microciclos[microcicloIndex].sesiones.length + 1,
      ejercicios: [],
    };
    mesociclos[mesocicloIndex].microciclos[microcicloIndex].sesiones.push(newSesion);
    setPlan({ ...plan, mesociclos });
  };

  const addEjercicioToSesion = (ejercicio: Ejercicio) => {
    if (!currentSesionPath) return;

    const { mesociclo, microciclo, sesion } = currentSesionPath;
    const mesociclos = [...plan.mesociclos];
    const ejercicios = mesociclos[mesociclo].microciclos[microciclo].sesiones[sesion].ejercicios;

    const newEjercicio: SesionEjercicio = {
      ejercicio_id: ejercicio.id,
      ejercicio: ejercicio,
      orden: ejercicios.length + 1,
      etapa: ejercicio.etapas?.[0] || 'Principal',
      series: 3,
      repeticiones: '10',
      intensidad_tipo: 'rir',
      intensidad_valor: 2,
      descanso: 90,
    };

    ejercicios.push(newEjercicio);
    setPlan({ ...plan, mesociclos });
    setShowEjercicioModal(false);
  };

  const removeMesociclo = (index: number) => {
    const mesociclos = plan.mesociclos.filter((_, i) => i !== index);
    mesociclos.forEach((m, i) => (m.numero = i + 1));
    setPlan({ ...plan, mesociclos });
  };

  const removeMicrociclo = (mesocicloIndex: number, microcicloIndex: number) => {
    const mesociclos = [...plan.mesociclos];
    mesociclos[mesocicloIndex].microciclos = mesociclos[mesocicloIndex].microciclos.filter(
      (_, i) => i !== microcicloIndex
    );
    mesociclos[mesocicloIndex].microciclos.forEach((m, i) => (m.numero = i + 1));
    setPlan({ ...plan, mesociclos });
  };

  const removeSesion = (mesocicloIndex: number, microcicloIndex: number, sesionIndex: number) => {
    const mesociclos = [...plan.mesociclos];
    mesociclos[mesocicloIndex].microciclos[microcicloIndex].sesiones = mesociclos[
      mesocicloIndex
    ].microciclos[microcicloIndex].sesiones.filter((_, i) => i !== sesionIndex);
    mesociclos[mesocicloIndex].microciclos[microcicloIndex].sesiones.forEach(
      (s, i) => (s.numero = i + 1)
    );
    setPlan({ ...plan, mesociclos });
  };

  const removeEjercicio = (
    mesocicloIndex: number,
    microcicloIndex: number,
    sesionIndex: number,
    ejercicioIndex: number
  ) => {
    const mesociclos = [...plan.mesociclos];
    mesociclos[mesocicloIndex].microciclos[microcicloIndex].sesiones[sesionIndex].ejercicios =
      mesociclos[mesocicloIndex].microciclos[microcicloIndex].sesiones[
        sesionIndex
      ].ejercicios.filter((_, i) => i !== ejercicioIndex);
    mesociclos[mesocicloIndex].microciclos[microcicloIndex].sesiones[
      sesionIndex
    ].ejercicios.forEach((e, i) => (e.orden = i + 1));
    setPlan({ ...plan, mesociclos });
  };

  const updateEjercicio = (
    mesocicloIndex: number,
    microcicloIndex: number,
    sesionIndex: number,
    ejercicioIndex: number,
    updates: Partial<SesionEjercicio>
  ) => {
    const mesociclos = [...plan.mesociclos];
    mesociclos[mesocicloIndex].microciclos[microcicloIndex].sesiones[sesionIndex].ejercicios[ejercicioIndex] = {
      ...mesociclos[mesocicloIndex].microciclos[microcicloIndex].sesiones[sesionIndex].ejercicios[ejercicioIndex],
      ...updates,
    };
    setPlan({ ...plan, mesociclos });
  };

  // Filtrar ejercicios por búsqueda
  const filteredEjercicios = ejercicios.filter((ej) =>
    ej.nombre.toLowerCase().includes(ejercicioSearch.toLowerCase())
  );

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando plan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-purple-600 rounded-2xl p-6 text-white shadow-sm">
        <button
          onClick={() => navigate('/entrenador/planes')}
          className="flex items-center gap-2 text-purple-100 hover:text-white mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a planes
        </button>

        <h1 className="text-3xl font-bold mb-2">
          {isNew ? 'Nuevo Plan de Entrenamiento' : 'Editar Plan'}
        </h1>
        {plan.entrenado && (
          <p className="text-purple-100">
            Para: {plan.entrenado.nombre} {plan.entrenado.apellido}
          </p>
        )}
      </div>

      {/* Error message */}
      {saveError && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{saveError}</span>
          <button onClick={() => setSaveError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Info básica del macrociclo */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Macrociclo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del plan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={plan.nombre}
              onChange={(e) => setPlan({ ...plan, nombre: e.target.value })}
              placeholder="Ej: Plan de hipertrofia - Fase 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de inicio <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={plan.fecha_inicio}
              onChange={(e) => setPlan({ ...plan, fecha_inicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha fin estimada
            </label>
            <input
              type="date"
              value={plan.fecha_fin_estimada || ''}
              onChange={(e) => setPlan({ ...plan, fecha_fin_estimada: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={plan.activo ? 'activo' : 'finalizado'}
              onChange={(e) => setPlan({ ...plan, activo: e.target.value === 'activo' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="activo">Activo</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo general</label>
            <textarea
              value={plan.objetivo_general}
              onChange={(e) => setPlan({ ...plan, objetivo_general: e.target.value })}
              rows={2}
              placeholder="Describe el objetivo principal del macrociclo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Mesociclos */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Mesociclos</h2>
          <button
            onClick={openMesoConfigModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Mesociclo
          </button>
        </div>

        {plan.mesociclos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Sin mesociclos</h3>
            <p className="text-gray-500 mb-4">Agregá tu primer mesociclo para comenzar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plan.mesociclos.map((mesociclo, mesocicloIndex) => (
              <div key={mesocicloIndex} className="bg-white rounded-xl shadow-sm overflow-hidden border-l-4 border-purple-500">
                {/* Header del mesociclo */}
                <div
                  className="p-4 bg-purple-50 flex items-center justify-between cursor-pointer hover:bg-purple-100"
                  onClick={() =>
                    setExpandedMesociclo(expandedMesociclo === mesocicloIndex ? null : mesocicloIndex)
                  }
                >
                  <div className="flex items-center gap-4">
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        expandedMesociclo === mesocicloIndex ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div>
                      <h3 className="font-medium text-gray-900">{mesociclo.nombre}</h3>
                      <p className="text-sm text-gray-500">
                        {tiposMesociclo.find((t) => t.value === mesociclo.tipo)?.label} •{' '}
                        {mesociclo.microciclos.length} microciclos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        mesociclo.desbloqueado
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {mesociclo.desbloqueado ? 'Desbloqueado' : 'Bloqueado'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('¿Eliminar este mesociclo?')) {
                          removeMesociclo(mesocicloIndex);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Contenido del mesociclo expandido */}
                {expandedMesociclo === mesocicloIndex && (
                  <div className="p-4 border-t">
                    {/* Configuración del mesociclo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          type="text"
                          value={mesociclo.nombre}
                          onChange={(e) => {
                            const mesociclos = [...plan.mesociclos];
                            mesociclos[mesocicloIndex].nombre = e.target.value;
                            setPlan({ ...plan, mesociclos });
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                          value={mesociclo.tipo}
                          onChange={(e) => {
                            const mesociclos = [...plan.mesociclos];
                            mesociclos[mesocicloIndex].tipo = e.target.value as Mesociclo['tipo'];
                            setPlan({ ...plan, mesociclos });
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          {tiposMesociclo.map((tipo) => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mesociclo.desbloqueado}
                            onChange={(e) => {
                              const mesociclos = [...plan.mesociclos];
                              mesociclos[mesocicloIndex].desbloqueado = e.target.checked;
                              setPlan({ ...plan, mesociclos });
                            }}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">Desbloqueado para entrenado</span>
                        </label>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
                        <input
                          type="text"
                          value={mesociclo.objetivo || ''}
                          onChange={(e) => {
                            const mesociclos = [...plan.mesociclos];
                            mesociclos[mesocicloIndex].objetivo = e.target.value;
                            setPlan({ ...plan, mesociclos });
                          }}
                          placeholder="Objetivo específico de este mesociclo..."
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* Microciclos */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-700">Microciclos</h4>
                        <button
                          onClick={() => openMicroConfigModal(mesocicloIndex)}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          + Agregar microciclo
                        </button>
                      </div>

                      {mesociclo.microciclos.map((microciclo, microcicloIndex) => (
                        <div key={microcicloIndex} className="border rounded-lg overflow-hidden border-l-4 border-blue-400">
                          <div
                            className="p-3 bg-blue-50 flex items-center justify-between cursor-pointer hover:bg-blue-100"
                            onClick={() =>
                              setExpandedMicrociclo(
                                expandedMicrociclo === `${mesocicloIndex}-${microcicloIndex}`
                                  ? null
                                  : `${mesocicloIndex}-${microcicloIndex}`
                              )
                            }
                          >
                            <div className="flex items-center gap-3">
                              <svg
                                className={`w-4 h-4 text-gray-500 transition-transform ${
                                  expandedMicrociclo === `${mesocicloIndex}-${microcicloIndex}`
                                    ? 'rotate-90'
                                    : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="font-medium text-gray-700">
                                {microciclo.nombre || `Semana ${microciclo.numero}`}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({tiposMicrociclo.find((t) => t.value === microciclo.tipo)?.label})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {microciclo.sesiones.length} sesiones
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMicrociclo(mesocicloIndex, microcicloIndex);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {expandedMicrociclo === `${mesocicloIndex}-${microcicloIndex}` && (
                            <div className="p-3 border-t space-y-3">
                              <div className="flex gap-4">
                                <div className="flex-1">
                                  <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                                  <select
                                    value={microciclo.tipo}
                                    onChange={(e) => {
                                      const mesociclos = [...plan.mesociclos];
                                      mesociclos[mesocicloIndex].microciclos[microcicloIndex].tipo =
                                        e.target.value as Microciclo['tipo'];
                                      setPlan({ ...plan, mesociclos });
                                    }}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                  >
                                    {tiposMicrociclo.map((tipo) => (
                                      <option key={tipo.value} value={tipo.value}>
                                        {tipo.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Sesiones */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <h5 className="text-sm font-medium text-gray-600">Sesiones</h5>
                                  <button
                                    onClick={() => addSesion(mesocicloIndex, microcicloIndex)}
                                    className="text-xs text-purple-600 hover:text-purple-700"
                                  >
                                    + Agregar sesión
                                  </button>
                                </div>

                                {microciclo.sesiones.map((sesion, sesionIndex) => (
                                  <div key={sesionIndex} className="bg-green-50 rounded-lg overflow-hidden border-l-4 border-green-400">
                                    <div
                                      className="p-2 flex items-center justify-between cursor-pointer hover:bg-green-100"
                                      onClick={() =>
                                        setExpandedSesion(
                                          expandedSesion ===
                                            `${mesocicloIndex}-${microcicloIndex}-${sesionIndex}`
                                            ? null
                                            : `${mesocicloIndex}-${microcicloIndex}-${sesionIndex}`
                                        )
                                      }
                                    >
                                      <div className="flex items-center gap-2">
                                        <svg
                                          className={`w-3 h-3 text-gray-500 transition-transform ${
                                            expandedSesion ===
                                            `${mesocicloIndex}-${microcicloIndex}-${sesionIndex}`
                                              ? 'rotate-90'
                                              : ''
                                          }`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="text-sm font-medium">
                                          {sesion.nombre || `Sesión ${sesion.numero}`}
                                        </span>
                                        {sesion.logica_entrenamiento && (
                                          <span className="text-xs text-gray-500">
                                            • {sesion.logica_entrenamiento}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">
                                          {sesion.ejercicios.length} ejercicios
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeSesion(mesocicloIndex, microcicloIndex, sesionIndex);
                                          }}
                                          className="p-1 text-gray-400 hover:text-red-500"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>

                                    {expandedSesion ===
                                      `${mesocicloIndex}-${microcicloIndex}-${sesionIndex}` && (
                                      <div className="p-3 border-t bg-white space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                              Nombre de la sesión
                                            </label>
                                            <input
                                              type="text"
                                              value={sesion.nombre || ''}
                                              onChange={(e) => {
                                                const mesociclos = [...plan.mesociclos];
                                                mesociclos[mesocicloIndex].microciclos[
                                                  microcicloIndex
                                                ].sesiones[sesionIndex].nombre = e.target.value;
                                                setPlan({ ...plan, mesociclos });
                                              }}
                                              placeholder="Ej: Día A - Tren superior"
                                              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-purple-500"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                              Lógica de entrenamiento
                                            </label>
                                            <input
                                              type="text"
                                              value={sesion.logica_entrenamiento || ''}
                                              onChange={(e) => {
                                                const mesociclos = [...plan.mesociclos];
                                                mesociclos[mesocicloIndex].microciclos[
                                                  microcicloIndex
                                                ].sesiones[sesionIndex].logica_entrenamiento =
                                                  e.target.value;
                                                setPlan({ ...plan, mesociclos });
                                              }}
                                              placeholder="Ej: Push/Pull/Legs"
                                              className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-purple-500"
                                            />
                                          </div>
                                        </div>

                                        {/* Lista de ejercicios */}
                                        <div>
                                          <div className="flex justify-between items-center mb-2">
                                            <h6 className="text-xs font-medium text-gray-600">
                                              Ejercicios
                                            </h6>
                                            <button
                                              onClick={() => {
                                                setCurrentSesionPath({
                                                  mesociclo: mesocicloIndex,
                                                  microciclo: microcicloIndex,
                                                  sesion: sesionIndex,
                                                });
                                                setShowEjercicioModal(true);
                                              }}
                                              className="text-xs text-purple-600 hover:text-purple-700"
                                            >
                                              + Agregar ejercicio
                                            </button>
                                          </div>

                                          {sesion.ejercicios.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-2">
                                              Sin ejercicios
                                            </p>
                                          ) : (
                                            <div className="space-y-2">
                                              {sesion.ejercicios.map((ejercicio, ejercicioIndex) => (
                                                <div key={ejercicioIndex} className="bg-gray-50 rounded-lg overflow-hidden">
                                                  <div
                                                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100"
                                                    onClick={() => setEditingEjercicio(
                                                      editingEjercicio?.ejercicio === ejercicioIndex &&
                                                      editingEjercicio?.sesion === sesionIndex
                                                        ? null
                                                        : { mesociclo: mesocicloIndex, microciclo: microcicloIndex, sesion: sesionIndex, ejercicio: ejercicioIndex }
                                                    )}
                                                  >
                                                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                                                      {ejercicio.orden}
                                                    </span>
                                                    <div className="flex-1">
                                                      <p className="font-medium text-gray-900 text-sm">
                                                        {ejercicio.ejercicio?.nombre}
                                                      </p>
                                                      <p className="text-xs text-gray-500">
                                                        {ejercicio.series}x{ejercicio.repeticiones || ejercicio.tiempo + 's'} •{' '}
                                                        {ejercicio.intensidad_tipo.toUpperCase()}{' '}
                                                        {ejercicio.intensidad_valor} •{' '}
                                                        {ejercicio.descanso}s desc.
                                                      </p>
                                                    </div>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeEjercicio(
                                                          mesocicloIndex,
                                                          microcicloIndex,
                                                          sesionIndex,
                                                          ejercicioIndex
                                                        );
                                                      }}
                                                      className="p-1 text-gray-400 hover:text-red-500"
                                                    >
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                      </svg>
                                                    </button>
                                                  </div>

                                                  {/* Panel de edición de ejercicio */}
                                                  {editingEjercicio?.mesociclo === mesocicloIndex &&
                                                    editingEjercicio?.microciclo === microcicloIndex &&
                                                    editingEjercicio?.sesion === sesionIndex &&
                                                    editingEjercicio?.ejercicio === ejercicioIndex && (
                                                    <div className="p-3 border-t bg-white space-y-3">
                                                      <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                          <label className="block text-xs text-gray-600 mb-1">Series</label>
                                                          <input
                                                            type="number"
                                                            min="1"
                                                            value={ejercicio.series}
                                                            onChange={(e) => updateEjercicio(
                                                              mesocicloIndex, microcicloIndex, sesionIndex, ejercicioIndex,
                                                              { series: parseInt(e.target.value) || 1 }
                                                            )}
                                                            className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-purple-500"
                                                          />
                                                        </div>
                                                        <div>
                                                          <label className="block text-xs text-gray-600 mb-1">Reps</label>
                                                          <input
                                                            type="text"
                                                            value={ejercicio.repeticiones || ''}
                                                            onChange={(e) => updateEjercicio(
                                                              mesocicloIndex, microcicloIndex, sesionIndex, ejercicioIndex,
                                                              { repeticiones: e.target.value }
                                                            )}
                                                            placeholder="8-10"
                                                            className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-purple-500"
                                                          />
                                                        </div>
                                                        <div>
                                                          <label className="block text-xs text-gray-600 mb-1">Desc (s)</label>
                                                          <input
                                                            type="number"
                                                            min="0"
                                                            step="15"
                                                            value={ejercicio.descanso}
                                                            onChange={(e) => updateEjercicio(
                                                              mesocicloIndex, microcicloIndex, sesionIndex, ejercicioIndex,
                                                              { descanso: parseInt(e.target.value) || 0 }
                                                            )}
                                                            className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-purple-500"
                                                          />
                                                        </div>
                                                      </div>
                                                      <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                          <label className="block text-xs text-gray-600 mb-1">Intensidad</label>
                                                          <select
                                                            value={ejercicio.intensidad_tipo}
                                                            onChange={(e) => updateEjercicio(
                                                              mesocicloIndex, microcicloIndex, sesionIndex, ejercicioIndex,
                                                              { intensidad_tipo: e.target.value as 'rir' | 'rpe' | 'porcentaje' }
                                                            )}
                                                            className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-purple-500"
                                                          >
                                                            <option value="rir">RIR</option>
                                                            <option value="rpe">RPE</option>
                                                            <option value="porcentaje">%</option>
                                                          </select>
                                                        </div>
                                                        <div>
                                                          <label className="block text-xs text-gray-600 mb-1">Valor</label>
                                                          <input
                                                            type="number"
                                                            min="0"
                                                            max={ejercicio.intensidad_tipo === 'porcentaje' ? 100 : 10}
                                                            value={ejercicio.intensidad_valor}
                                                            onChange={(e) => updateEjercicio(
                                                              mesocicloIndex, microcicloIndex, sesionIndex, ejercicioIndex,
                                                              { intensidad_valor: parseInt(e.target.value) || 0 }
                                                            )}
                                                            className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-purple-500"
                                                          />
                                                        </div>
                                                      </div>
                                                      <div>
                                                        <label className="block text-xs text-gray-600 mb-1">Observaciones</label>
                                                        <input
                                                          type="text"
                                                          value={ejercicio.observaciones || ''}
                                                          onChange={(e) => updateEjercicio(
                                                            mesocicloIndex, microcicloIndex, sesionIndex, ejercicioIndex,
                                                            { observaciones: e.target.value }
                                                          )}
                                                          placeholder="Notas adicionales..."
                                                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-purple-500"
                                                        />
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer con acciones */}
      <div className="sticky bottom-0 bg-white border-t p-4 -mx-6 -mb-6 mt-6 flex justify-between gap-3">
        <div>
          {!isNew && plan.id && (
            <button
              onClick={() => setShowPlantillaModal(true)}
              className="px-4 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Guardar como plantilla
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/entrenador/planes')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => savePlanMutation.mutate(plan)}
            disabled={savePlanMutation.isPending || !plan.nombre || !plan.entrenado_id}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {savePlanMutation.isPending ? 'Guardando...' : 'Guardar Plan'}
          </button>
        </div>
      </div>

      {/* Modal selección de ejercicio */}
      {showEjercicioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Agregar Ejercicio</h2>
                <button
                  onClick={() => {
                    setShowEjercicioModal(false);
                    setEjercicioSearch('');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar ejercicio..."
                  value={ejercicioSearch}
                  onChange={(e) => setEjercicioSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              {filteredEjercicios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron ejercicios</p>
                  <p className="text-sm">Probá con otro término de búsqueda</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filteredEjercicios.map((ejercicio) => (
                    <button
                      key={ejercicio.id}
                      onClick={() => addEjercicioToSesion(ejercicio)}
                      className="flex items-center gap-3 p-3 text-left border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{ejercicio.nombre}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {ejercicio.etapas?.join(', ') || ejercicio.categorias_zona?.join(', ') || 'General'}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-center text-sm text-gray-400 mt-4">
                {filteredEjercicios.length} ejercicios disponibles
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear plantilla */}
      {showPlantillaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Guardar como Plantilla</h2>
                <button
                  onClick={() => {
                    setShowPlantillaModal(false);
                    setPlantillaForm({ nombre: '', descripcion: '' });
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Crea una plantilla a partir de este plan para reutilizarla con otros entrenados.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la plantilla <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={plantillaForm.nombre}
                  onChange={(e) => setPlantillaForm({ ...plantillaForm, nombre: e.target.value })}
                  placeholder="Ej: Hipertrofia principiante 3 días"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={plantillaForm.descripcion}
                  onChange={(e) => setPlantillaForm({ ...plantillaForm, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Describe brevemente para qué tipo de entrenado es ideal esta plantilla..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPlantillaModal(false);
                  setPlantillaForm({ nombre: '', descripcion: '' });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePlantilla}
                disabled={!plantillaForm.nombre || createPlantillaMutation.isPending}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {createPlantillaMutation.isPending ? 'Guardando...' : 'Crear Plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal configurar mesociclo */}
      {showMesoConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b bg-purple-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Nuevo Mesociclo</h2>
                <button
                  onClick={() => setShowMesoConfigModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Configurá la estructura del nuevo mesociclo
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={mesoConfig.nombre}
                  onChange={(e) => setMesoConfig({ ...mesoConfig, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={mesoConfig.tipo}
                  onChange={(e) => setMesoConfig({ ...mesoConfig, tipo: e.target.value as Mesociclo['tipo'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {tiposMesociclo.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad de microciclos (semanas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={mesoConfig.cantidadMicros}
                    onChange={(e) => setMesoConfig({ ...mesoConfig, cantidadMicros: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sesiones por microciclo
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={mesoConfig.sesionesPorMicro}
                    onChange={(e) => setMesoConfig({ ...mesoConfig, sesionesPorMicro: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                Se crearán <strong>{mesoConfig.cantidadMicros}</strong> semanas con{' '}
                <strong>{mesoConfig.sesionesPorMicro}</strong> sesiones cada una.
                <br />
                Total: <strong>{mesoConfig.cantidadMicros * mesoConfig.sesionesPorMicro}</strong> sesiones.
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowMesoConfigModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addMesociclo}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Crear Mesociclo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal configurar microciclo */}
      {showMicroConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b bg-blue-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Nuevo Microciclo</h2>
                <button
                  onClick={() => setShowMicroConfigModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Configurá la estructura del nuevo microciclo (semana)
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={microConfig.nombre}
                  onChange={(e) => setMicroConfig({ ...microConfig, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={microConfig.tipo}
                  onChange={(e) => setMicroConfig({ ...microConfig, tipo: e.target.value as Microciclo['tipo'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {tiposMicrociclo.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad de sesiones
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={microConfig.cantidadSesiones}
                  onChange={(e) => setMicroConfig({ ...microConfig, cantidadSesiones: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowMicroConfigModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addMicrociclo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Microciclo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
