import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface Evaluacion {
  id: number;
  tipo: string;
  nombre: string;
  descripcion?: string;
  valor: number;
  unidad: string;
  fecha: string;
  entrenador_nombre: string;
}

interface EvaluacionAgrupada {
  nombre: string;
  tipo: string;
  unidad: string;
  evaluaciones: Evaluacion[];
  mejora_porcentaje?: number;
}

const tiposEvaluacion = {
  fuerza_maxima: { label: 'Fuerza Máxima (1RM)', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3', color: 'red' },
  resistencia: { label: 'Resistencia', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'yellow' },
  aerobico: { label: 'Aeróbico', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', color: 'pink' },
  flexibilidad: { label: 'Flexibilidad', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', color: 'purple' },
  personalizado: { label: 'Personalizado', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', color: 'blue' },
};

export default function Evaluaciones() {
  const [tipoFiltro, setTipoFiltro] = useState<string>('');
  const [evaluacionExpandida, setEvaluacionExpandida] = useState<string | null>(null);

  const { data: evaluaciones, isLoading } = useQuery<Evaluacion[]>({
    queryKey: ['mis-evaluaciones'],
    queryFn: async () => {
      try {
        const response = await api.get('/mi/evaluaciones');
        return response.data.data || response.data || [];
      } catch {
        return [];
      }
    },
  });

  // Agrupar evaluaciones por nombre/tipo para ver evolución
  const evaluacionesAgrupadas = (): EvaluacionAgrupada[] => {
    if (!evaluaciones) return [];

    const grupos: Record<string, EvaluacionAgrupada> = {};

    evaluaciones.forEach((ev) => {
      const key = `${ev.tipo}-${ev.nombre}`;
      if (!grupos[key]) {
        grupos[key] = {
          nombre: ev.nombre,
          tipo: ev.tipo,
          unidad: ev.unidad,
          evaluaciones: [],
        };
      }
      grupos[key].evaluaciones.push(ev);
    });

    // Ordenar cada grupo por fecha y calcular mejora
    Object.values(grupos).forEach((grupo) => {
      grupo.evaluaciones.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

      if (grupo.evaluaciones.length >= 2) {
        const primera = grupo.evaluaciones[0].valor;
        const ultima = grupo.evaluaciones[grupo.evaluaciones.length - 1].valor;
        grupo.mejora_porcentaje = ((ultima - primera) / primera) * 100;
      }
    });

    return Object.values(grupos).filter(
      (g) => !tipoFiltro || g.tipo === tipoFiltro
    );
  };

  const getTipoConfig = (tipo: string) => {
    return tiposEvaluacion[tipo as keyof typeof tiposEvaluacion] || tiposEvaluacion.personalizado;
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
      pink: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
    };
    return colors[color] || colors.blue;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando evaluaciones...</p>
      </div>
    );
  }

  const grupos = evaluacionesAgrupadas();

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-orange-500 rounded-2xl p-6 text-white shadow-sm">
        <h1 className="text-3xl font-bold mb-1">Mis Evaluaciones</h1>
        <p className="text-orange-100">Seguimiento de tu rendimiento y progreso</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTipoFiltro('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !tipoFiltro
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {Object.entries(tiposEvaluacion).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setTipoFiltro(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tipoFiltro === key
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de evaluaciones agrupadas */}
      {grupos.length > 0 ? (
        <div className="space-y-4">
          {grupos.map((grupo) => {
            const tipoConfig = getTipoConfig(grupo.tipo);
            const colorClasses = getColorClasses(tipoConfig.color);
            const isExpanded = evaluacionExpandida === `${grupo.tipo}-${grupo.nombre}`;
            const ultimaEvaluacion = grupo.evaluaciones[grupo.evaluaciones.length - 1];

            return (
              <div
                key={`${grupo.tipo}-${grupo.nombre}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() =>
                    setEvaluacionExpandida(isExpanded ? null : `${grupo.tipo}-${grupo.nombre}`)
                  }
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${colorClasses.bg} flex items-center justify-center`}>
                      <svg className={`w-6 h-6 ${colorClasses.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tipoConfig.icon} />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{grupo.nombre}</p>
                      <p className="text-sm text-gray-500">
                        {tipoConfig.label} • {grupo.evaluaciones.length} registros
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {ultimaEvaluacion.valor} <span className="text-sm font-normal text-gray-500">{grupo.unidad}</span>
                      </p>
                      {grupo.mejora_porcentaje !== undefined && (
                        <p className={`text-sm font-medium ${
                          grupo.mejora_porcentaje >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {grupo.mejora_porcentaje >= 0 ? '+' : ''}
                          {grupo.mejora_porcentaje.toFixed(1)}% desde inicio
                        </p>
                      )}
                    </div>
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
                    <h4 className="text-sm font-medium text-gray-700 mt-4 mb-3">Historial de evaluaciones:</h4>
                    <div className="space-y-2">
                      {grupo.evaluaciones.slice().reverse().map((ev, idx) => (
                        <div
                          key={ev.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            idx === 0 ? `${colorClasses.bg} ${colorClasses.border} border` : 'bg-gray-50'
                          }`}
                        >
                          <div>
                            <p className={`font-medium ${idx === 0 ? colorClasses.text : 'text-gray-900'}`}>
                              {ev.valor} {ev.unidad}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(ev.fecha).toLocaleDateString('es-AR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                              {' • '}Por {ev.entrenador_nombre}
                            </p>
                            {ev.descripcion && (
                              <p className="text-xs text-gray-400 mt-1">{ev.descripcion}</p>
                            )}
                          </div>
                          {idx === 0 && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}>
                              Último
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Mini gráfico de evolución */}
                    {grupo.evaluaciones.length > 1 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h5 className="text-xs font-medium text-gray-500 mb-2">Evolución</h5>
                        <div className="flex items-end gap-1 h-16">
                          {grupo.evaluaciones.map((ev, idx) => {
                            const max = Math.max(...grupo.evaluaciones.map((e) => e.valor));
                            const height = (ev.valor / max) * 100;
                            return (
                              <div
                                key={ev.id}
                                className={`flex-1 rounded-t ${
                                  idx === grupo.evaluaciones.length - 1
                                    ? 'bg-orange-500'
                                    : 'bg-orange-200'
                                }`}
                                style={{ height: `${height}%` }}
                                title={`${ev.valor} ${grupo.unidad} - ${new Date(ev.fecha).toLocaleDateString('es-AR')}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay evaluaciones</h3>
          <p className="text-gray-500">Tu entrenador registrará tus evaluaciones de rendimiento</p>
        </div>
      )}
    </div>
  );
}
