import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface EstadisticasGenerales {
  sesiones_totales: number;
  sesiones_completadas: number;
  porcentaje_asistencia: number;
  racha_actual: number;
  mejor_racha: number;
  dias_entrenando: number;
  tonelaje_total: number;
}

interface ProgresionEjercicio {
  ejercicio_id: number;
  ejercicio_nombre: string;
  mejor_peso: number;
  mejor_repeticiones: number;
  rm_estimado: number;
  progresion_porcentaje: number;
  historial: {
    fecha: string;
    peso: number;
    repeticiones: number;
  }[];
}

interface TonelajeSemanal {
  semana: string;
  tonelaje: number;
}

interface DistribucionMusculo {
  grupo: string;
  volumen: number;
  porcentaje: number;
}

export default function Progresion() {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'semana' | 'mes' | 'trimestre'>('mes');

  // Fetch estadísticas generales
  const { data: estadisticas, isLoading: loadingStats } = useQuery<EstadisticasGenerales>({
    queryKey: ['estadisticas-generales'],
    queryFn: async () => {
      try {
        const response = await api.get('/mi/estadisticas');
        const stats = response.data?.data || response.data || {};
        return {
          porcentaje_asistencia: stats.porcentaje_asistencia || stats.entrenamientos?.porcentaje_asistencia || 0,
          sesiones_completadas: stats.sesiones_completadas || stats.entrenamientos?.total || 0,
          sesiones_totales: stats.sesiones_totales || 0,
          mejor_racha: stats.mejor_racha || stats.racha?.mejor || 0,
          racha_actual: stats.racha_actual || stats.racha?.actual || 0,
          dias_entrenando: stats.dias_entrenando || stats.entrenamientos?.total || 0,
          tonelaje_total: stats.tonelaje_total || 0,
        };
      } catch {
        // Datos de fallback para desarrollo
        return {
          sesiones_totales: 0,
          sesiones_completadas: 0,
          porcentaje_asistencia: 0,
          racha_actual: 0,
          mejor_racha: 0,
          dias_entrenando: 0,
          tonelaje_total: 0,
        };
      }
    },
  });

  // Fetch progresión por ejercicio
  const { data: progresionEjercicios = [] } = useQuery<ProgresionEjercicio[]>({
    queryKey: ['progresion-ejercicios', periodoSeleccionado],
    queryFn: async () => {
      try {
        const response = await api.get(`/mi/progresion/ejercicios?periodo=${periodoSeleccionado}`);
        return response.data.data || response.data || [];
      } catch {
        return [];
      }
    },
  });

  // Fetch tonelaje semanal
  const { data: tonelajeSemanal = [] } = useQuery<TonelajeSemanal[]>({
    queryKey: ['tonelaje-semanal', periodoSeleccionado],
    queryFn: async () => {
      try {
        const response = await api.get(`/mi/progresion/tonelaje?periodo=${periodoSeleccionado}`);
        return response.data.data || response.data || [];
      } catch {
        return [];
      }
    },
  });

  // Fetch distribución por grupo muscular
  const { data: distribucionMuscular = [] } = useQuery<DistribucionMusculo[]>({
    queryKey: ['distribucion-muscular'],
    queryFn: async () => {
      try {
        const response = await api.get('/mi/progresion/distribucion');
        return response.data.data || response.data || [];
      } catch {
        return [];
      }
    },
  });

  // Calcular máximo de tonelaje para escala del gráfico
  const maxTonelaje = Math.max(...tonelajeSemanal.map(t => t.tonelaje), 1);

  // Colores para grupos musculares
  const coloresMusculares: Record<string, string> = {
    'Pectorales': 'bg-red-500',
    'Dorsales': 'bg-blue-500',
    'Deltoides': 'bg-yellow-500',
    'Bíceps': 'bg-green-500',
    'Tríceps': 'bg-purple-500',
    'Cuádriceps': 'bg-orange-500',
    'Isquiotibiales': 'bg-pink-500',
    'Glúteos': 'bg-indigo-500',
    'Core': 'bg-teal-500',
    'Otro': 'bg-gray-500',
  };

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-purple-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Mi Progresión</h1>
            <p className="text-purple-100 mt-1">Seguimiento de tu evolución</p>
          </div>
          <div className="flex gap-1 bg-white/20 rounded-lg p-1">
            {(['semana', 'mes', 'trimestre'] as const).map((periodo) => (
              <button
                key={periodo}
                onClick={() => setPeriodoSeleccionado(periodo)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  periodoSeleccionado === periodo
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {periodo === 'semana' ? 'Semana' : periodo === 'mes' ? 'Mes' : '3 meses'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">Asistencia</p>
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {estadisticas?.porcentaje_asistencia || 0}%
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {estadisticas?.sesiones_completadas || 0}/{estadisticas?.sesiones_totales || 0} sesiones
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">Racha actual</p>
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {estadisticas?.racha_actual || 0}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Mejor: {estadisticas?.mejor_racha || 0} días
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">Tonelaje total</p>
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {((estadisticas?.tonelaje_total || 0) / 1000).toFixed(1)}t
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              kg levantados
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">Días entrenando</p>
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {estadisticas?.dias_entrenando || 0}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              desde que empezaste
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico de tonelaje semanal */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tonelaje por semana</h2>

          {tonelajeSemanal.length > 0 ? (
            <div className="space-y-3">
              {tonelajeSemanal.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">{item.semana}</span>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(item.tonelaje / maxTonelaje) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16 text-right">
                    {(item.tonelaje / 1000).toFixed(1)}t
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>Aún no hay datos de tonelaje</p>
              <p className="text-sm">Completá sesiones para ver tu evolución</p>
            </div>
          )}
        </div>

        {/* Distribución por grupo muscular */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribución por músculo</h2>

          {distribucionMuscular.length > 0 ? (
            <div className="space-y-3">
              {distribucionMuscular.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300 w-28 flex-shrink-0">{item.grupo}</span>
                  <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${coloresMusculares[item.grupo] || 'bg-gray-500'}`}
                      style={{ width: `${item.porcentaje}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">{item.porcentaje}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <p>Sin datos de distribución</p>
              <p className="text-sm">Los datos aparecerán cuando completes sesiones</p>
            </div>
          )}
        </div>
      </div>

      {/* Progresión por ejercicio */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mejores marcas</h2>
          <Link to="/entrenado/historial" className="text-sm text-purple-600 hover:text-purple-700">
            Ver historial completo
          </Link>
        </div>

        {progresionEjercicios.length > 0 ? (
          <div className="divide-y">
            {progresionEjercicios.slice(0, 10).map((ejercicio) => (
              <div key={ejercicio.ejercicio_id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{ejercicio.ejercicio_nombre}</p>
                    <div className="flex gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
                        </svg>
                        {ejercicio.mejor_peso}kg × {ejercicio.mejor_repeticiones}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-purple-600">
                        1RM: {ejercicio.rm_estimado.toFixed(1)}kg
                      </span>
                    </div>
                  </div>
                  {ejercicio.progresion_porcentaje !== 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                      ejercicio.progresion_porcentaje > 0
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700'
                        : 'bg-red-100 dark:bg-red-900/50 text-red-700'
                    }`}>
                      {ejercicio.progresion_porcentaje > 0 ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      {Math.abs(ejercicio.progresion_porcentaje).toFixed(1)}%
                    </div>
                  )}
                </div>

                {/* Mini gráfico de historial */}
                {ejercicio.historial && ejercicio.historial.length > 1 && (
                  <div className="mt-3 flex items-end gap-1 h-8">
                    {ejercicio.historial.slice(-8).map((punto, idx) => {
                      const maxPeso = Math.max(...ejercicio.historial.map(h => h.peso));
                      const altura = (punto.peso / maxPeso) * 100;
                      return (
                        <div
                          key={idx}
                          className="flex-1 bg-purple-200 rounded-t transition-all hover:bg-purple-300"
                          style={{ height: `${altura}%` }}
                          title={`${punto.fecha}: ${punto.peso}kg × ${punto.repeticiones}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Sin registros de progresión</h3>
            <p className="mb-4">Completá sesiones y registrá tus pesos para ver tu evolución</p>
            <Link
              to="/entrenado/plan"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Ir a mi plan
            </Link>
          </div>
        )}
      </div>

      {/* Tips motivacionales */}
      <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-purple-900">Consejo para mejorar</h3>
            <p className="text-purple-700 text-sm mt-1">
              La clave del progreso es la consistencia. Intentá mantener tu racha de entrenamiento y registrar siempre tus pesos para ver tu evolución real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
