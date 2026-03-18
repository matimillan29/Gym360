import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { getMisEstadisticas } from '../../services/estadisticas';
import type { EstadisticasCompletas } from '../../services/estadisticas';
import LogroBadge from '../../components/LogroBadge';

interface EstadisticasRapidas {
  porcentaje_asistencia: number;
  sesiones_completadas: number;
  sesiones_totales: number;
  racha_actual: number;
  tonelaje_ultimo_mes: number;
}

interface SesionHoy {
  id: number;
  numero: number;
  logica_entrenamiento?: string;
  ejercicios_count: number;
}

interface CuotaActual {
  estado: 'pagado' | 'pendiente' | 'vencido' | 'mora';
  fecha_vencimiento: string;
  plan_nombre: string;
}

export default function DashboardEntrenado() {
  const { user } = useAuth();

  // Fetch sesión de hoy
  const { data: sesionHoy } = useQuery<SesionHoy | null>({
    queryKey: ['sesion-hoy'],
    queryFn: async () => {
      try {
        const response = await api.get('/mi/plan/sesion-hoy');
        return response.data.data ?? null;
      } catch {
        return null;
      }
    },
  });

  // Fetch estado de cuota
  const { data: cuotaActual } = useQuery<CuotaActual | null>({
    queryKey: ['cuota-actual'],
    queryFn: async () => {
      try {
        const response = await api.get('/mi/cuotas');
        const cuotas = response.data.data || [];
        // Obtener la cuota activa más reciente
        return cuotas.length > 0 ? cuotas[0] : null;
      } catch {
        return null;
      }
    },
  });

  // Fetch estadísticas completas (incluye rapidas, rachas y logros)
  const { data: estadisticasCompletas } = useQuery<EstadisticasCompletas | null>({
    queryKey: ['mis-estadisticas'],
    queryFn: async () => {
      try {
        return await getMisEstadisticas();
      } catch {
        return null;
      }
    },
  });

  // Derive quick stats from complete stats
  const estadisticas: EstadisticasRapidas | null = estadisticasCompletas ? (() => {
    const total = estadisticasCompletas.entrenamientos?.total ?? 0;
    const mes = estadisticasCompletas.entrenamientos?.mes ?? 0;
    return {
      porcentaje_asistencia: total > 0 ? Math.round((mes / total) * 100) : 0,
      sesiones_completadas: mes,
      sesiones_totales: total,
      racha_actual: estadisticasCompletas.racha?.actual ?? 0,
      tonelaje_ultimo_mes: (estadisticasCompletas as Record<string, unknown>).tonelaje_mes as number ?? 0,
    };
  })() : null;

  const getCuotaStatus = () => {
    if (!cuotaActual) return null;

    const statusConfig = {
      pagado: {
        bg: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
        icon: 'bg-green-100 dark:bg-green-900/50',
        iconColor: 'text-green-600',
        title: 'text-green-800 dark:text-green-300',
        subtitle: 'text-green-600 dark:text-green-400',
        label: 'Cuota al día',
      },
      pendiente: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
        icon: 'bg-yellow-100 dark:bg-yellow-900/50',
        iconColor: 'text-yellow-600',
        title: 'text-yellow-800 dark:text-yellow-300',
        subtitle: 'text-yellow-600 dark:text-yellow-400',
        label: 'Pago pendiente',
      },
      vencido: {
        bg: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
        icon: 'bg-orange-100 dark:bg-orange-900/50',
        iconColor: 'text-orange-600',
        title: 'text-orange-800 dark:text-orange-300',
        subtitle: 'text-orange-600 dark:text-orange-400',
        label: 'Cuota vencida',
      },
      mora: {
        bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
        icon: 'bg-red-100 dark:bg-red-900/50',
        iconColor: 'text-red-600',
        title: 'text-red-800 dark:text-red-300',
        subtitle: 'text-red-600 dark:text-red-400',
        label: 'En mora',
      },
    };

    return statusConfig[cuotaActual.estado];
  };

  const cuotaStatus = getCuotaStatus();

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-green-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-1">
          ¡Hola, {user?.nombre}!
        </h1>
        <p className="text-green-100">
          Tu resumen de entrenamiento
        </p>
      </div>

      {/* Cuota status */}
      {cuotaStatus && cuotaActual && (
        <div className={`border rounded-xl p-4 ${cuotaStatus.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${cuotaStatus.icon}`}>
              <svg className={`w-5 h-5 ${cuotaStatus.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className={`font-medium ${cuotaStatus.title}`}>{cuotaStatus.label}</p>
              <p className={`text-sm ${cuotaStatus.subtitle}`}>
                Vence el {new Date(cuotaActual.fecha_vencimiento).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's session */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sesión de hoy</h2>
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          {sesionHoy ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <span className="text-xl font-bold text-green-600">{sesionHoy.numero}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Sesión {sesionHoy.numero}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {sesionHoy.logica_entrenamiento || `${sesionHoy.ejercicios_count} ejercicios`}
                  </p>
                </div>
              </div>
              <Link
                to="/entrenado/sesion"
                className="block w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-center font-medium rounded-lg transition-colors"
              >
                Comenzar sesión
              </Link>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No tenés sesión programada para hoy</p>
              <Link to="/entrenado/plan" className="text-green-600 hover:text-green-700 text-sm font-medium">
                Ver mi plan completo
              </Link>
            </div>
          )}
        </div>

        {/* Progress summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mi progreso</h2>
            <Link to="/entrenado/progresion" className="text-sm text-green-600 hover:text-green-700">
              Ver más
            </Link>
          </div>

          {estadisticas && (estadisticas.sesiones_completadas > 0 || estadisticas.racha_actual > 0) ? (
            <div className="space-y-4">
              {/* Asistencia */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Asistencia</span>
                  <span className="font-medium text-gray-900 dark:text-white">{estadisticas.porcentaje_asistencia}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${estadisticas.porcentaje_asistencia}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {estadisticas.sesiones_completadas}/{estadisticas.sesiones_totales} sesiones completadas
                </p>
              </div>

              {/* Stats rápidas */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-center gap-1 text-orange-600">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                    <span className="text-xl font-bold truncate">{estadisticas.racha_actual}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">Racha actual</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-center gap-1 text-blue-600">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
                    </svg>
                    <span className="text-xl font-bold truncate">{(estadisticas.tonelaje_ultimo_mes / 1000).toFixed(1)}t</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">Este mes</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p>Aún no hay datos de progreso</p>
              <p className="text-sm">Completá sesiones para ver tu evolución</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/entrenado/plan"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mi plan</span>
          </Link>

          <Link
            to="/entrenado/perfil"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mi perfil</span>
          </Link>

          <Link
            to="/entrenado/historial"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Historial</span>
          </Link>

          <Link
            to="/entrenado/progresion"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso</span>
          </Link>
        </div>
      </div>

      {/* Racha y logros */}
      {estadisticasCompletas && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {/* Racha banner */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{estadisticasCompletas.racha.actual}</span>
                    <span className="text-sm opacity-80">
                      {estadisticasCompletas.racha.actual === 1 ? 'dia' : 'dias'} de racha
                    </span>
                  </div>
                  {estadisticasCompletas.racha.activa && estadisticasCompletas.racha.actual > 0 && (
                    <p className="text-xs opacity-80">Racha activa</p>
                  )}
                </div>
              </div>
              <Link
                to="/entrenado/logros"
                className="text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Ver logros
              </Link>
            </div>
          </div>

          {/* Logros recientes */}
          {estadisticasCompletas.logros.recientes.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Logros recientes</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {estadisticasCompletas.logros.desbloqueados}/{estadisticasCompletas.logros.total}
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {estadisticasCompletas.logros.recientes.slice(0, 4).map((logro) => (
                  <LogroBadge
                    key={logro.id}
                    nombre={logro.nombre}
                    descripcion={logro.descripcion}
                    icono={logro.icono}
                    color={logro.color}
                    desbloqueado={true}
                    desbloqueado_en={logro.desbloqueado_en}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}

          {estadisticasCompletas.logros.recientes.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">Completa entrenamientos para desbloquear logros</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
