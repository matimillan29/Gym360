import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { verificarLogros } from '../../services/estadisticas';
import RestTimer from '../../components/RestTimer';
import NuevoLogroModal from '../../components/NuevoLogroModal';
import type { SesionEjercicioDisplay } from '../../types';

interface SesionRegistro {
  id: number;
  numero: number;
  logica_entrenamiento?: string;
  ejercicios: SesionEjercicioDisplay[];
}

interface RegistroEjercicio {
  sesion_ejercicio_id: number;
  peso: number | null;
  repeticiones: number | null;
  series_completadas: number;
  intensidad_percibida: number;
  percepcion_carga: number;
  sensacion_general: number;
  completado: boolean;
  observaciones: string;
}

export default function RegistrarSesion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedbackGeneral, setFeedbackGeneral] = useState('');
  const [registros, setRegistros] = useState<Record<number, RegistroEjercicio>>({});
  const [ejercicioActivo, setEjercicioActivo] = useState<number | null>(null);
  const [nuevosLogros, setNuevosLogros] = useState<Array<{
    id: number;
    nombre: string;
    descripcion: string;
    icono: string;
    color: string;
  }>>([]);
  const [initialized, setInitialized] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: sesion, isLoading } = useQuery<SesionRegistro | null>({
    queryKey: ['sesion', id || 'hoy'],
    queryFn: async () => {
      try {
        // Si hay un ID específico, cargar esa sesión; si no, cargar la del día
        const endpoint = id ? `/mi/sesiones/${id}` : '/mi/plan/sesion-hoy';
        const response = await api.get(endpoint);
        return response.data.data ?? null;
      } catch {
        return null;
      }
    },
  });

  // Initialize state only once when data is loaded
  useEffect(() => {
    if (sesion?.ejercicios && !initialized) {
      const initialRegistros: Record<number, RegistroEjercicio> = {};
      sesion.ejercicios.forEach((ej: SesionEjercicioDisplay) => {
        initialRegistros[ej.sesion_ejercicio_id] = {
          sesion_ejercicio_id: ej.sesion_ejercicio_id,
          peso: null,
          repeticiones: null,
          series_completadas: 0,
          intensidad_percibida: 7,
          percepcion_carga: 5,
          sensacion_general: 7,
          completado: false,
          observaciones: '',
        };
      });
      setRegistros(initialRegistros);
      if (sesion.ejercicios.length > 0) {
        setEjercicioActivo(sesion.ejercicios[0].sesion_ejercicio_id);
      }
      setInitialized(true);
    }
  }, [sesion, initialized]);

  const guardarMutation = useMutation({
    mutationFn: async () => {
      setSaveError(null);
      const response = await api.post(`/mi/sesiones/${sesion?.id}/registrar`, {
        ejercicios: Object.values(registros),
        feedback_general: feedbackGeneral,
      });
      return response.data;
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al guardar la sesión. Intentá nuevamente.';
      setSaveError(msg);
      toast.error(msg);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['sesion'] });
      queryClient.invalidateQueries({ queryKey: ['mi-plan'] });
      queryClient.invalidateQueries({ queryKey: ['mi-historial'] });
      queryClient.invalidateQueries({ queryKey: ['mis-estadisticas'] });

      // Verificar y otorgar logros
      try {
        const resultado = await verificarLogros();
        if (resultado.nuevos_logros && resultado.nuevos_logros.length > 0) {
          setNuevosLogros(resultado.nuevos_logros);
        } else {
          navigate('/entrenado');
        }
      } catch {
        // Si falla la verificacion de logros, igual navegar
        navigate('/entrenado');
      }
    },
  });

  const handleCerrarLogros = () => {
    setNuevosLogros([]);
    navigate('/entrenado');
  };

  const actualizarRegistro = (id: number, campo: keyof RegistroEjercicio, valor: unknown) => {
    setRegistros((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [campo]: valor,
      },
    }));
  };

  const toggleCompletado = (id: number) => {
    setRegistros((prev) => {
      const newState = {
        ...prev,
        [id]: { ...prev[id], completado: !prev[id].completado },
      };
      // Auto-advance to next exercise when marking as completed
      if (!prev[id].completado && sesion) {
        const currentIndex = sesion.ejercicios.findIndex(e => e.sesion_ejercicio_id === id);
        const nextExercise = sesion.ejercicios[currentIndex + 1];
        if (nextExercise) {
          setTimeout(() => setEjercicioActivo(nextExercise.sesion_ejercicio_id), 300);
        }
      }
      return newState;
    });
  };

  const navigateExercise = (direction: 'prev' | 'next') => {
    if (!sesion || !ejercicioActivo) return;
    const currentIndex = sesion.ejercicios.findIndex(e => e.sesion_ejercicio_id === ejercicioActivo);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < sesion.ejercicios.length) {
      setEjercicioActivo(sesion.ejercicios[newIndex].sesion_ejercicio_id);
    }
  };


  const ejerciciosCompletados = Object.values(registros).filter((r) => r.completado).length;
  const totalEjercicios = sesion?.ejercicios.length || 0;
  const progreso = totalEjercicios > 0 ? (ejerciciosCompletados / totalEjercicios) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Cargando sesión...</p>
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="space-y-6 fade-in">
        <div className="bg-green-600 rounded-2xl p-6 text-white shadow-sm">
          <h1 className="text-3xl font-bold mb-1">Registrar Sesión</h1>
          <p className="text-green-100">Cargá tu entrenamiento del día</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No hay sesión para hoy</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Consultá tu plan para ver las próximas sesiones</p>
          <button
            onClick={() => navigate('/entrenado/plan')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Ver mi plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header con progreso */}
      <div className="bg-green-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Sesión {sesion.numero}</h1>
            <p className="text-green-100">
              {sesion.logica_entrenamiento || `${totalEjercicios} ejercicios`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{ejerciciosCompletados}/{totalEjercicios}</p>
            <p className="text-green-100 text-sm">completados</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      {/* Lista de ejercicios */}
      <div className="space-y-4">
        {sesion.ejercicios.map((ejercicio, index) => {
          const registro = registros[ejercicio.sesion_ejercicio_id];
          const isActive = ejercicioActivo === ejercicio.sesion_ejercicio_id;
          const isCompleted = registro?.completado;

          return (
            <div
              key={ejercicio.sesion_ejercicio_id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all ${
                isCompleted ? 'border-green-300 bg-green-50 dark:bg-green-900/30' : ''
              }`}
            >
              {/* Header del ejercicio */}
              <button
                onClick={() => setEjercicioActivo(isActive ? null : ejercicio.sesion_ejercicio_id)}
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                  isCompleted
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{ejercicio.nombre}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {ejercicio.series} x {ejercicio.repeticiones} •{' '}
                    {ejercicio.intensidad_tipo?.toUpperCase()} {ejercicio.intensidad_valor} •{' '}
                    {ejercicio.descanso}s descanso
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${isActive ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Formulario de registro */}
              {isActive && registro && (
                <div className="px-4 pb-4 space-y-4 border-t dark:border-gray-700">
                  {ejercicio.observaciones && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>Nota del entrenador:</strong> {ejercicio.observaciones}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={registro.peso || ''}
                        onChange={(e) =>
                          actualizarRegistro(
                            ejercicio.sesion_ejercicio_id,
                            'peso',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        className="w-full px-3 py-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Repeticiones
                      </label>
                      <input
                        type="number"
                        value={registro.repeticiones || ''}
                        onChange={(e) =>
                          actualizarRegistro(
                            ejercicio.sesion_ejercicio_id,
                            'repeticiones',
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        className="w-full px-3 py-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Series completadas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Series completadas
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          actualizarRegistro(
                            ejercicio.sesion_ejercicio_id,
                            'series_completadas',
                            Math.max(0, registro.series_completadas - 1)
                          )
                        }
                        className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="flex-1 text-center text-xl font-bold">
                        {registro.series_completadas} / {ejercicio.series}
                      </span>
                      <button
                        onClick={() =>
                          actualizarRegistro(
                            ejercicio.sesion_ejercicio_id,
                            'series_completadas',
                            Math.min(ejercicio.series, registro.series_completadas + 1)
                          )
                        }
                        className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Rating bars para feedback */}
                  <div className="space-y-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tu percepción del ejercicio</p>

                    {/* Intensidad percibida */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Intensidad</span>
                        <span className="text-sm font-medium text-green-600">{registro.intensidad_percibida}/10</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <button
                            key={n}
                            onClick={() => actualizarRegistro(ejercicio.sesion_ejercicio_id, 'intensidad_percibida', n)}
                            className={`flex-1 h-8 rounded transition-colors ${
                              n <= registro.intensidad_percibida
                                ? n <= 3 ? 'bg-green-400' : n <= 6 ? 'bg-yellow-400' : n <= 8 ? 'bg-orange-400' : 'bg-red-500'
                                : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Percepción de carga */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Carga</span>
                        <span className="text-sm font-medium text-blue-600">{registro.percepcion_carga}/10</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <button
                            key={n}
                            onClick={() => actualizarRegistro(ejercicio.sesion_ejercicio_id, 'percepcion_carga', n)}
                            className={`flex-1 h-8 rounded transition-colors ${
                              n <= registro.percepcion_carga
                                ? n <= 3 ? 'bg-blue-300' : n <= 6 ? 'bg-blue-400' : n <= 8 ? 'bg-blue-500' : 'bg-blue-600'
                                : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Sensación general */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Cómo te sentís</span>
                        <span className="text-sm font-medium text-purple-600">{registro.sensacion_general}/10</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <button
                            key={n}
                            onClick={() => actualizarRegistro(ejercicio.sesion_ejercicio_id, 'sensacion_general', n)}
                            className={`flex-1 h-8 rounded transition-colors ${
                              n <= registro.sensacion_general
                                ? n <= 3 ? 'bg-red-400' : n <= 5 ? 'bg-orange-400' : n <= 7 ? 'bg-yellow-400' : 'bg-green-500'
                                : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={registro.observaciones}
                      onChange={(e) =>
                        actualizarRegistro(ejercicio.sesion_ejercicio_id, 'observaciones', e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Notas sobre el ejercicio..."
                    />
                  </div>

                  <button
                    onClick={() => toggleCompletado(ejercicio.sesion_ejercicio_id)}
                    className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      isCompleted
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 hover:bg-green-200'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Ejercicio completado
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Marcar como completado
                      </>
                    )}
                  </button>

                  {/* Navegación prev/next */}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => navigateExercise('prev')}
                      disabled={index === 0}
                      className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Anterior
                    </button>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {index + 1} de {totalEjercicios}
                    </span>
                    <button
                      onClick={() => navigateExercise('next')}
                      disabled={index === totalEjercicios - 1}
                      className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Siguiente
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback general */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Feedback de la sesión</h3>
        <textarea
          value={feedbackGeneral}
          onChange={(e) => setFeedbackGeneral(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="¿Cómo te sentiste? ¿Alguna observación para tu entrenador?"
        />
      </div>

      {/* Error al guardar */}
      {saveError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 text-sm">
          {saveError}
        </div>
      )}

      {/* Botón guardar */}
      <div className="sticky bottom-4">
        <button
          onClick={() => guardarMutation.mutate()}
          disabled={guardarMutation.isPending || ejerciciosCompletados === 0}
          className="w-full py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
        >
          {guardarMutation.isPending ? (
            'Guardando...'
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar sesión ({ejerciciosCompletados}/{totalEjercicios} ejercicios)
            </>
          )}
        </button>
      </div>

      {/* Timer de descanso flotante */}
      <RestTimer
        defaultTime={
          ejercicioActivo
            ? sesion.ejercicios.find(e => e.sesion_ejercicio_id === ejercicioActivo)?.descanso || 60
            : 60
        }
      />

      {/* Modal de nuevos logros */}
      {nuevosLogros.length > 0 && (
        <NuevoLogroModal logros={nuevosLogros} onClose={handleCerrarLogros} />
      )}
    </div>
  );
}
