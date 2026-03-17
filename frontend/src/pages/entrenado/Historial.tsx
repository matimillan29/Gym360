import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface RegistroEjercicio {
  id: number;
  ejercicio_nombre: string;
  peso: number | null;
  repeticiones: number | null;
  series_completadas: number;
  intensidad_percibida: number;
  completado: boolean;
}

interface RegistroSesion {
  id: number;
  sesion_numero: number;
  fecha: string;
  estado: 'completado' | 'parcial' | 'falto';
  feedback_general?: string;
  ejercicios: RegistroEjercicio[];
  microciclo_numero: number;
  mesociclo_nombre: string;
}

interface EstadisticaResumen {
  total_sesiones: number;
  sesiones_completadas: number;
  sesiones_parciales: number;
  asistencia_porcentaje: number;
  tonelaje_total: number;
}

interface EstadisticasApiResponse {
  racha?: { actual?: number; maxima?: number; activa?: boolean };
  entrenamientos?: { semana?: number; mes?: number; total?: number };
  logros?: unknown;
}

export default function Historial() {
  const [expandedRegistro, setExpandedRegistro] = useState<number | null>(null);
  const [filtroMes, setFiltroMes] = useState<string>('');

  const { data: registros, isLoading } = useQuery<RegistroSesion[]>({
    queryKey: ['mi-historial', filtroMes],
    queryFn: async () => {
      try {
        const params = filtroMes ? `?mes=${filtroMes}` : '';
        const response = await api.get(`/mi/historial${params}`);
        return response.data.data || response.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: estadisticas } = useQuery<EstadisticaResumen>({
    queryKey: ['mi-estadisticas'],
    queryFn: async () => {
      try {
        const response = await api.get('/mi/estadisticas');
        const raw: EstadisticasApiResponse = response.data.data || response.data;
        const total = raw.entrenamientos?.total || 0;
        const mes = raw.entrenamientos?.mes || 0;
        return {
          total_sesiones: total,
          sesiones_completadas: mes,
          sesiones_parciales: 0,
          asistencia_porcentaje: total > 0 ? Math.round((mes / total) * 100) : 0,
          tonelaje_total: 0,
        };
      } catch {
        return {
          total_sesiones: 0,
          sesiones_completadas: 0,
          sesiones_parciales: 0,
          asistencia_porcentaje: 0,
          tonelaje_total: 0,
        };
      }
    },
  });

  const getEstadoConfig = (estado: string) => {
    const configs = {
      completado: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'Completada',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      },
      parcial: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        label: 'Parcial',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      falto: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        label: 'Faltó',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      },
    };
    return configs[estado as keyof typeof configs] || configs.completado;
  };

  const mesesDisponibles = () => {
    const meses = [];
    const hoy = new Date();
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      meses.push({
        value: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
        label: fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
      });
    }
    return meses;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-purple-600 rounded-2xl p-6 text-white shadow-sm">
        <h1 className="text-3xl font-bold mb-1">Mi Historial</h1>
        <p className="text-purple-100">Registro de todas tus sesiones completadas</p>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.total_sesiones}</p>
                <p className="text-xs text-gray-500">Sesiones totales</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.sesiones_completadas}</p>
                <p className="text-xs text-gray-500">Completadas</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.asistencia_porcentaje}%</p>
                <p className="text-xs text-gray-500">Asistencia</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.tonelaje_total.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Tonelaje (kg)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtro */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por mes:</label>
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Todos</option>
            {mesesDisponibles().map((mes) => (
              <option key={mes.value} value={mes.value}>
                {mes.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de registros */}
      {registros && registros.length > 0 ? (
        <div className="space-y-4">
          {registros.map((registro) => {
            const estadoConfig = getEstadoConfig(registro.estado);
            const isExpanded = expandedRegistro === registro.id;

            return (
              <div
                key={registro.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedRegistro(isExpanded ? null : registro.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-purple-600">{registro.sesion_numero}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        Sesión {registro.sesion_numero} - {registro.mesociclo_nombre}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(registro.fecha).toLocaleDateString('es-AR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                        {' • '}Semana {registro.microciclo_numero}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                      {estadoConfig.icon}
                      {estadoConfig.label}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t">
                    {registro.feedback_general && (
                      <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm text-purple-800">
                          <strong>Feedback:</strong> {registro.feedback_general}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Ejercicios registrados:</h4>
                      {registro.ejercicios.map((ejercicio) => (
                        <div
                          key={ejercicio.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            ejercicio.completado ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {ejercicio.completado ? (
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            <span className="font-medium text-gray-900">{ejercicio.ejercicio_nombre}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {ejercicio.peso && `${ejercicio.peso}kg`}
                            {ejercicio.repeticiones && ` × ${ejercicio.repeticiones} reps`}
                            {ejercicio.series_completadas > 0 && ` × ${ejercicio.series_completadas} series`}
                            {ejercicio.intensidad_percibida && ` • RPE ${ejercicio.intensidad_percibida}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay registros</h3>
          <p className="text-gray-500">Completá sesiones para ver tu historial</p>
        </div>
      )}
    </div>
  );
}
