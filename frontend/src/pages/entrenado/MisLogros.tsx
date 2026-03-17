import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMisEstadisticas } from '../../services/estadisticas';
import LogroBadge from '../../components/LogroBadge';
import RachaDisplay from '../../components/RachaDisplay';

const CATEGORIA_LABELS: Record<string, string> = {
  streak: 'Rachas',
  workout: 'Entrenamientos',
  consistency: 'Consistencia',
  special: 'Especiales',
};

const CATEGORIA_ICONS: Record<string, ReactNode> = {
  streak: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
  ),
  workout: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
  ),
  consistency: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  ),
  special: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  ),
};

export default function MisLogros() {
  const { data: estadisticas, isLoading } = useQuery({
    queryKey: ['mis-estadisticas'],
    queryFn: getMisEstadisticas,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudieron cargar las estadisticas</p>
      </div>
    );
  }

  const { racha, entrenamientos, logros } = estadisticas;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis logros</h1>
          <p className="text-gray-500">Tu progreso y medallas</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-green-600">
            {logros.desbloqueados}/{logros.total}
          </p>
          <p className="text-sm text-gray-500">logros desbloqueados</p>
        </div>
      </div>

      {/* Racha */}
      <RachaDisplay
        rachaActual={racha.actual}
        rachaMaxima={racha.maxima}
        activa={racha.activa}
        entrenamientosSemana={entrenamientos.semana}
        entrenamientosMes={entrenamientos.mes}
        entrenamientosTotal={entrenamientos.total}
      />

      {/* Progreso general */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Progreso general</h2>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(logros.desbloqueados / logros.total) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {Math.round((logros.desbloqueados / logros.total) * 100)}% completado
        </p>
      </div>

      {/* Logros recientes */}
      {logros.recientes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Logros recientes</h2>
          <div className="flex flex-wrap gap-6 justify-center">
            {logros.recientes.map((logro) => (
              <LogroBadge
                key={logro.id}
                nombre={logro.nombre}
                descripcion={logro.descripcion}
                icono={logro.icono}
                color={logro.color}
                desbloqueado={true}
                desbloqueado_en={logro.desbloqueado_en}
                size="lg"
              />
            ))}
          </div>
        </div>
      )}

      {/* Logros por categoria */}
      {Object.entries(logros.por_categoria).map(([categoria, logrosCategoria]) => (
        <div key={categoria} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {CATEGORIA_ICONS[categoria]}
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">
              {CATEGORIA_LABELS[categoria] || categoria}
            </h2>
            <span className="ml-auto text-sm text-gray-500">
              {logrosCategoria.filter((l) => l.desbloqueado).length}/{logrosCategoria.length}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {logrosCategoria.map((logro) => (
              <LogroBadge
                key={logro.id}
                nombre={logro.nombre}
                descripcion={logro.descripcion}
                icono={logro.icono}
                color={logro.color}
                desbloqueado={logro.desbloqueado}
                desbloqueado_en={logro.desbloqueado_en}
                size="md"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
