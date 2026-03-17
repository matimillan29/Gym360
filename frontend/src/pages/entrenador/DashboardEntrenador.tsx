import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface DashboardStats {
  entrenados_activos: number;
  entrenados_baja_temporal: number;
  planes_activos: number;
  total_ejercicios: number;
  sesiones_hoy: number;
  cuotas_pendientes: number;
  cuotas_vencidas: number;
  asistencia_promedio: number;
  evaluaciones_mes: number;
}

interface AlertaEntrenado {
  id: number;
  nombre: string;
  apellido: string;
  tipo: 'baja_asistencia' | 'sin_sesiones' | 'cuota_vencida';
  detalle: string;
}

interface EntrenadoReciente {
  id: number;
  nombre: string;
  apellido: string;
  ultima_sesion?: string;
  proxima_sesion?: string;
  estado_cuota: 'pagado' | 'pendiente' | 'vencido' | 'mora';
}

interface ActividadReciente {
  id: number;
  tipo: 'sesion' | 'pago' | 'evaluacion' | 'nuevo_entrenado';
  descripcion: string;
  entrenado_nombre: string;
  fecha: string;
}

export default function DashboardEntrenador() {
  const { user, gymConfig } = useAuth();

  const { data: stats, isLoading: loadingStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/dashboard/entrenador');
        return response.data.data || response.data;
      } catch {
        // Fallback con datos por defecto
        const ejerciciosRes = await api.get<{ data: unknown[] }>('/ejercicios');
        return {
          entrenados_activos: 0,
          entrenados_baja_temporal: 0,
          planes_activos: 0,
          total_ejercicios: ejerciciosRes.data.data?.length || 0,
          sesiones_hoy: 0,
          cuotas_pendientes: 0,
          cuotas_vencidas: 0,
          asistencia_promedio: 0,
          evaluaciones_mes: 0,
        };
      }
    },
  });

  const { data: entrenadosRecientes } = useQuery<EntrenadoReciente[]>({
    queryKey: ['entrenados-recientes'],
    queryFn: async () => {
      try {
        const response = await api.get('/entrenados?limit=5&sort=ultima_actividad');
        return response.data.data || response.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: actividades } = useQuery<ActividadReciente[]>({
    queryKey: ['actividad-reciente'],
    queryFn: async () => {
      try {
        const response = await api.get('/dashboard/actividad-reciente');
        return response.data.data || response.data || [];
      } catch {
        return [];
      }
    },
  });

  // Alertas de entrenados que requieren atención
  const { data: alertas } = useQuery<AlertaEntrenado[]>({
    queryKey: ['alertas-entrenados'],
    queryFn: async () => {
      try {
        const response = await api.get('/dashboard/alertas');
        return response.data.data || response.data || [];
      } catch {
        return [];
      }
    },
  });

  const getAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case 'baja_asistencia':
        return (
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
        );
      case 'sin_sesiones':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'cuota_vencida':
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getCuotaStatusConfig = (estado: string) => {
    const configs = {
      pagado: { bg: 'bg-green-100', text: 'text-green-700', label: 'Al día' },
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
      vencido: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Vencido' },
      mora: { bg: 'bg-red-100', text: 'text-red-700', label: 'En mora' },
    };
    return configs[estado as keyof typeof configs] || configs.pendiente;
  };

  const getActividadIcon = (tipo: string) => {
    switch (tipo) {
      case 'sesion':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'pago':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'evaluacion':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              ¡Hola, {user?.nombre}!
            </h1>
            <p className="text-blue-100 mt-1">
              Bienvenido al panel de {gymConfig?.nombre || 'Pwr360'}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">
              {new Date().toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/entrenador/entrenados" className="bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Entrenados activos</p>
              {loadingStats ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.entrenados_activos || 0}</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link to="/entrenador/planes" className="bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Planes activos</p>
              {loadingStats ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.planes_activos || 0}</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </Link>

        <Link to="/entrenador/ejercicios" className="bg-white rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Ejercicios</p>
              {loadingStats ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.total_ejercicios || 0}</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
              </svg>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Sesiones hoy</p>
              {loadingStats ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats?.sesiones_hoy || 0}</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.asistencia_promedio || 0}%</p>
              <p className="text-xs text-gray-500">Asistencia promedio</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.evaluaciones_mes || 0}</p>
              <p className="text-xs text-gray-500">Evaluaciones este mes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.cuotas_pendientes || 0}</p>
              <p className="text-xs text-gray-500">Cuotas pendientes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.cuotas_vencidas || 0}</p>
              <p className="text-xs text-gray-500">Cuotas vencidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de entrenados */}
      {alertas && alertas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="font-semibold text-orange-800">Entrenados que requieren atención</h3>
            <span className="ml-auto px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs font-medium">
              {alertas.length}
            </span>
          </div>
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {alertas.slice(0, 5).map((alerta) => (
              <Link
                key={alerta.id}
                to={`/entrenador/entrenados/${alerta.id}`}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                {getAlertaIcon(alerta.tipo)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{alerta.nombre} {alerta.apellido}</p>
                  <p className="text-sm text-gray-500 truncate">{alerta.detalle}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
          {alertas.length > 5 && (
            <div className="p-3 bg-gray-50 border-t text-center">
              <Link to="/entrenador/entrenados" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                Ver todos ({alertas.length})
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entrenados recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Entrenados</h2>
            <Link to="/entrenador/entrenados" className="text-sm text-blue-600 hover:text-blue-700">
              Ver todos
            </Link>
          </div>

          {entrenadosRecientes && entrenadosRecientes.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {entrenadosRecientes.map((entrenado) => {
                const cuotaConfig = getCuotaStatusConfig(entrenado.estado_cuota);
                return (
                  <Link
                    key={entrenado.id}
                    to={`/entrenador/entrenados/${entrenado.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {entrenado.nombre.charAt(0)}{entrenado.apellido.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {entrenado.nombre} {entrenado.apellido}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entrenado.proxima_sesion
                            ? `Próxima sesión: ${new Date(entrenado.proxima_sesion).toLocaleDateString('es-AR')}`
                            : 'Sin sesiones programadas'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cuotaConfig.bg} ${cuotaConfig.text}`}>
                      {cuotaConfig.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500">No hay entrenados aún</p>
              <Link to="/entrenador/entrenados" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Agregar primer entrenado
              </Link>
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Actividad reciente</h2>
          </div>

          {actividades && actividades.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {actividades.map((actividad) => (
                <div key={actividad.id} className="p-4 flex items-start gap-3">
                  {getActividadIcon(actividad.tipo)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{actividad.descripcion}</p>
                    <p className="text-xs text-gray-500">
                      {actividad.entrenado_nombre} •{' '}
                      {new Date(actividad.fecha).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-sm">No hay actividad reciente</p>
            </div>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/entrenador/entrenados"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Nuevo entrenado</span>
          </Link>

          <Link
            to="/entrenador/planes"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Crear plan</span>
          </Link>

          <Link
            to="/entrenador/ejercicios"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Ver ejercicios</span>
          </Link>

          <Link
            to="/entrenador/evaluaciones"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Evaluaciones</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
