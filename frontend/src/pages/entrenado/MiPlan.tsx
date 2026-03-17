import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { PlanActivo, SesionEjercicioDisplay } from '../../types';

const ETAPA_COLORS: Record<string, string> = {
  'Movilidad': 'bg-cyan-100 text-cyan-700',
  'Calentamiento': 'bg-yellow-100 text-yellow-700',
  'Activación': 'bg-orange-100 text-orange-700',
  'Zona media / Core': 'bg-purple-100 text-purple-700',
  'Principal': 'bg-green-100 text-green-700',
  'Accesorios': 'bg-blue-100 text-blue-700',
  'Enfriamiento / Vuelta a la calma': 'bg-gray-100 text-gray-700',
};

export default function MiPlan() {
  const navigate = useNavigate();
  const [expandedSesion, setExpandedSesion] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { data: plan, isLoading } = useQuery<PlanActivo | null>({
    queryKey: ['mi-plan'],
    queryFn: async () => {
      try {
        const response = await api.get('/mi/plan');
        return response.data.data || response.data;
      } catch {
        return null;
      }
    },
  });

  const handleDownloadPdf = async () => {
    if (!plan) return;
    setDownloading(true);
    try {
      const response = await api.get('/mi/plan/pdf', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plan-entrenamiento.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!plan) return;
    setSendingEmail(true);
    try {
      await api.post('/mi/plan/enviar-email');
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleStartSession = (sesionId: number) => {
    navigate(`/entrenado/sesion/${sesionId}`);
  };

  const getIntensidadLabel = (tipo: string, valor: number) => {
    switch (tipo) {
      case 'rir':
        return `RIR ${valor}`;
      case 'rpe':
        return `RPE ${valor}`;
      case 'porcentaje':
        return `${valor}%`;
      default:
        return `${valor}`;
    }
  };

  const getEtapaColor = (etapa: string) => {
    return ETAPA_COLORS[etapa] || 'bg-gray-100 text-gray-700';
  };

  // Agrupar ejercicios por etapa
  const groupByEtapa = (ejercicios: SesionEjercicioDisplay[]) => {
    const groups: { etapa: string; ejercicios: SesionEjercicioDisplay[] }[] = [];
    let currentEtapa = '';
    let currentGroup: SesionEjercicioDisplay[] = [];

    ejercicios.forEach(ej => {
      if (ej.etapa !== currentEtapa) {
        if (currentGroup.length > 0) {
          groups.push({ etapa: currentEtapa, ejercicios: currentGroup });
        }
        currentEtapa = ej.etapa;
        currentGroup = [ej];
      } else {
        currentGroup.push(ej);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ etapa: currentEtapa, ejercicios: currentGroup });
    }

    return groups;
  };

  // Contar sesiones completadas
  const getTotalStats = () => {
    if (!plan?.mesociclo_actual) return { total: 0, completadas: 0 };
    let total = 0;
    let completadas = 0;
    plan.mesociclo_actual.microciclos.forEach(micro => {
      micro.sesiones.forEach(sesion => {
        total++;
        if (sesion.completada) completadas++;
      });
    });
    return { total, completadas };
  };

  const stats = getTotalStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando plan...</p>
      </div>
    );
  }

  // Empty state cuando no hay plan asignado
  if (!plan || !plan.mesociclo_actual) {
    return (
      <div className="space-y-6 fade-in">
        <div className="bg-green-600 rounded-2xl p-6 text-white shadow-sm">
          <h1 className="text-3xl font-bold mb-1">Mi Plan de Entrenamiento</h1>
          <p className="text-green-100">Tu plan de entrenamiento actual</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tenés un plan asignado</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Tu entrenador todavía no te asignó un plan de entrenamiento.
            Contactalo para que pueda crearte uno personalizado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-green-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-1">Mi Plan de Entrenamiento</h1>
            <p className="text-green-100">
              {plan?.objetivo_general || 'Tu plan de entrenamiento actual'}
            </p>
          </div>
          {plan && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || emailSent}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm disabled:opacity-75"
                title="Enviar plan por email"
              >
                {sendingEmail ? (
                  '...'
                ) : emailSent ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Enviado
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm disabled:opacity-75"
                title="Descargar PDF"
              >
                {downloading ? (
                  '...'
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {plan && stats.total > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progreso del mesociclo</span>
                  <span>{stats.completadas}/{stats.total} sesiones</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${(stats.completadas / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {plan && plan.mesociclo_actual ? (
        <div className="space-y-4">
          {/* Indicador de progreso de etapas */}
          {plan.total_mesociclos > 1 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Progreso del plan</h3>
                <span className="text-sm text-gray-500">
                  Etapa {plan.mesociclo_actual.numero} de {plan.total_mesociclos}
                </span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: plan.total_mesociclos }).map((_, index) => {
                  const stageNum = index + 1;
                  const isCurrent = stageNum === plan.mesociclo_actual?.numero;
                  const isUnlocked = stageNum <= plan.mesociclos_desbloqueados;
                  const isCompleted = stageNum < (plan.mesociclo_actual?.numero || 0);

                  return (
                    <div
                      key={index}
                      className={`flex-1 h-2 rounded-full ${
                        isCompleted
                          ? 'bg-green-500'
                          : isCurrent
                          ? 'bg-green-400'
                          : isUnlocked
                          ? 'bg-green-200'
                          : 'bg-gray-200'
                      }`}
                      title={
                        isCompleted
                          ? `Etapa ${stageNum} completada`
                          : isCurrent
                          ? `Etapa ${stageNum} en curso`
                          : isUnlocked
                          ? `Etapa ${stageNum} desbloqueada`
                          : `Etapa ${stageNum} bloqueada`
                      }
                    />
                  );
                })}
              </div>
              {plan.mesociclos_desbloqueados < plan.total_mesociclos && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {plan.total_mesociclos - plan.mesociclos_desbloqueados} etapa{plan.total_mesociclos - plan.mesociclos_desbloqueados > 1 ? 's' : ''} bloqueada{plan.total_mesociclos - plan.mesociclos_desbloqueados > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Info del mesociclo actual */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900 truncate">{plan.mesociclo_actual.nombre}</h2>
                  {plan.total_mesociclos > 1 && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      (Etapa {plan.mesociclo_actual.numero})
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 capitalize truncate">
                  {plan.mesociclo_actual.tipo} • {plan.mesociclo_actual.objetivo}
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Desbloqueado
              </span>
            </div>
          </div>

          {/* Microciclos */}
          {plan.mesociclo_actual.microciclos.map((microciclo) => (
            <div key={microciclo.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">Semana {microciclo.numero}</h3>
                  <p className="text-sm text-gray-500 capitalize">{microciclo.tipo}</p>
                </div>
                <span className="text-sm text-gray-400">
                  {microciclo.sesiones.filter(s => s.completada).length}/{microciclo.sesiones.length} completadas
                </span>
              </div>

              <div className="divide-y">
                {microciclo.sesiones.map((sesion) => (
                  <div key={sesion.id}>
                    <div
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedSesion(expandedSesion === sesion.id ? null : sesion.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          sesion.completada
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {sesion.completada ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="font-bold">{sesion.numero}</span>
                          )}
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <p className="font-medium text-gray-900">Sesión {sesion.numero}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {sesion.logica_entrenamiento || `${sesion.ejercicios.length} ejercicios`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!sesion.completada && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartSession(sesion.id);
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Iniciar
                          </button>
                        )}
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedSesion === sesion.id ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {expandedSesion === sesion.id && (
                      <div className="px-4 pb-4 space-y-4">
                        {sesion.observaciones && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            <strong>Nota:</strong> {sesion.observaciones}
                          </div>
                        )}

                        {groupByEtapa(sesion.ejercicios).map((group, groupIdx) => (
                          <div key={groupIdx}>
                            <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${getEtapaColor(group.etapa)}`}>
                              {group.etapa}
                            </div>
                            <div className="space-y-2">
                              {group.ejercicios.map((ejercicio, index) => (
                                <div
                                  key={ejercicio.id}
                                  className={`p-3 bg-gray-50 rounded-lg ${
                                    ejercicio.superserie_con ? 'border-l-4 border-purple-400' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                      {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{ejercicio.nombre}</p>
                                        {ejercicio.video_url && (
                                          <a
                                            href={ejercicio.video_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-green-600 hover:text-green-700"
                                          >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                          </a>
                                        )}
                                        {ejercicio.superserie_con && (
                                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                            Superserie
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                          </svg>
                                          {ejercicio.series} series
                                        </span>
                                        <span>•</span>
                                        <span>
                                          {ejercicio.tiempo
                                            ? `${ejercicio.tiempo}s`
                                            : `${ejercicio.repeticiones} reps`}
                                        </span>
                                        <span>•</span>
                                        <span className="font-medium text-green-600">
                                          {getIntensidadLabel(ejercicio.intensidad_tipo, ejercicio.intensidad_valor)}
                                        </span>
                                        <span>•</span>
                                        <span>{ejercicio.descanso}s desc.</span>
                                      </div>
                                      {ejercicio.observaciones && (
                                        <p className="text-xs text-gray-400 mt-1 italic">
                                          {ejercicio.observaciones}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {sesion.completada && sesion.fecha_completada && (
                          <div className="flex items-center gap-2 text-sm text-green-600 pt-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Completada el {new Date(sesion.fecha_completada).toLocaleDateString('es-AR')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No tenés un plan asignado</h3>
          <p className="text-gray-500">Tu entrenador te asignará un plan próximamente</p>
        </div>
      )}
    </div>
  );
}
