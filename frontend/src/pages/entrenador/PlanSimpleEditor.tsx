import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronDown, ChevronUp, Search, ArrowLeft, Save, X } from 'lucide-react';
import api from '../../services/api';
import { createPlanSimple, getPlanSimple, updatePlanSimple } from '../../services/planesSimples';
import type { Ejercicio } from '../../types';
import type { AxiosError } from 'axios';

interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
}

interface EjercicioForm {
  ejercicio_id: number;
  nombre: string;
  orden: number;
  etapa: string;
  series: number;
  repeticiones: string;
  descanso: number;
  intensidad_tipo: string;
  intensidad_valor: string;
  observaciones: string;
}

interface DiaForm {
  id?: number;
  numero: number;
  nombre: string;
  logica_entrenamiento: string;
  observaciones: string;
  expanded: boolean;
  ejercicios: EjercicioForm[];
}

export default function PlanSimpleEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id;
  const entrenadoIdFromUrl = searchParams.get('entrenado');

  // Plan state
  const [nombre, setNombre] = useState('');
  const [objetivoGeneral, setObjetivoGeneral] = useState('');
  const [dias, setDias] = useState<DiaForm[]>([]);
  const [entrenadoId, setEntrenadoId] = useState<number>(entrenadoIdFromUrl ? parseInt(entrenadoIdFromUrl) : 0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Exercise picker state
  const [showEjercicioModal, setShowEjercicioModal] = useState(false);
  const [ejercicioSearch, setEjercicioSearch] = useState('');
  const [currentDiaIndex, setCurrentDiaIndex] = useState<number | null>(null);

  // Editing exercise inline
  const [editingEjercicio, setEditingEjercicio] = useState<{ dia: number; ejercicio: number } | null>(null);

  // Fetch existing plan for editing
  const { data: planData, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['plan-simple', id],
    queryFn: async () => {
      const data = await getPlanSimple(Number(id));
      return data;
    },
    enabled: !isNew && !!id,
  });

  // Fetch entrenado info
  const { data: entrenado } = useQuery({
    queryKey: ['entrenado', entrenadoId || entrenadoIdFromUrl],
    queryFn: async () => {
      const eid = entrenadoId || entrenadoIdFromUrl;
      const response = await api.get(`/entrenados/${eid}`);
      return response.data.data || response.data;
    },
    enabled: !!(entrenadoId || entrenadoIdFromUrl),
  });

  // Fetch all exercises for the picker
  const { data: ejercicios = [] } = useQuery<Ejercicio[]>({
    queryKey: ['ejercicios'],
    queryFn: async () => {
      const response = await api.get('/ejercicios');
      return response.data.data || response.data || [];
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (planData) {
      setNombre(planData.nombre || '');
      setObjetivoGeneral(planData.objetivo_general || '');
      setEntrenadoId(planData.entrenado_id);

      const loadedDias: DiaForm[] = (planData.dias || []).map((dia: {
        id?: number;
        numero: number;
        nombre?: string;
        logica_entrenamiento?: string;
        observaciones?: string;
        ejercicios?: Array<{
          ejercicio_id: number;
          ejercicio?: { nombre: string };
          orden: number;
          etapa?: string;
          series?: number;
          repeticiones?: string | number;
          descanso?: number;
          intensidad_tipo?: string;
          intensidad_valor?: number | string;
          observaciones?: string;
        }>;
      }, idx: number) => ({
        id: dia.id,
        numero: dia.numero || idx + 1,
        nombre: dia.nombre || '',
        logica_entrenamiento: dia.logica_entrenamiento || '',
        observaciones: dia.observaciones || '',
        expanded: idx === 0,
        ejercicios: (dia.ejercicios || []).map((ej, ejIdx: number) => ({
          ejercicio_id: ej.ejercicio_id,
          nombre: ej.ejercicio?.nombre || `Ejercicio ${ej.ejercicio_id}`,
          orden: ej.orden || ejIdx + 1,
          etapa: ej.etapa || 'Principal',
          series: ej.series || 3,
          repeticiones: String(ej.repeticiones || '10'),
          descanso: ej.descanso || 90,
          intensidad_tipo: ej.intensidad_tipo || 'rir',
          intensidad_valor: String(ej.intensidad_valor || '2'),
          observaciones: ej.observaciones || '',
        })),
      }));
      setDias(loadedDias);
    }
  }, [planData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre,
        objetivo_general: objetivoGeneral || undefined,
        dias: dias.map((dia) => ({
          id: dia.id,
          numero: dia.numero,
          nombre: dia.nombre || undefined,
          logica_entrenamiento: dia.logica_entrenamiento || undefined,
          observaciones: dia.observaciones || undefined,
          ejercicios: dia.ejercicios.map((ej) => ({
            ejercicio_id: ej.ejercicio_id,
            orden: ej.orden,
            etapa: ej.etapa || undefined,
            series: ej.series,
            repeticiones: ej.repeticiones || undefined,
            descanso: ej.descanso || undefined,
            intensidad_tipo: ej.intensidad_tipo || undefined,
            intensidad_valor: ej.intensidad_valor ? Number(ej.intensidad_valor) : undefined,
            observaciones: ej.observaciones || undefined,
          })),
        })),
      };

      if (isNew) {
        return createPlanSimple(entrenadoId, payload);
      } else {
        return updatePlanSimple(Number(id), payload);
      }
    },
    onSuccess: () => {
      setSaveError(null);
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['planes'] });
      queryClient.invalidateQueries({ queryKey: ['planes-simples'] });
      setTimeout(() => {
        navigate('/entrenador/planes');
      }, 600);
    },
    onError: (err: AxiosError<ApiError>) => {
      const message = err.response?.data?.message
        || Object.values(err.response?.data?.errors || {})[0]?.[0]
        || 'Error al guardar el plan';
      setSaveError(message);
      setSaveSuccess(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  // Dia management
  const addDia = useCallback(() => {
    const newDia: DiaForm = {
      numero: dias.length + 1,
      nombre: `Dia ${dias.length + 1}`,
      logica_entrenamiento: '',
      observaciones: '',
      expanded: true,
      ejercicios: [],
    };
    setDias((prev) => {
      // Collapse all others
      const updated = prev.map((d) => ({ ...d, expanded: false }));
      return [...updated, newDia];
    });
  }, [dias.length]);

  const removeDia = useCallback((index: number) => {
    setDias((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((d, i) => ({ ...d, numero: i + 1 }));
    });
  }, []);

  const toggleDia = useCallback((index: number) => {
    setDias((prev) =>
      prev.map((d, i) => ({
        ...d,
        expanded: i === index ? !d.expanded : d.expanded,
      }))
    );
  }, []);

  const updateDia = useCallback((index: number, updates: Partial<DiaForm>) => {
    setDias((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...updates } : d))
    );
  }, []);

  // Exercise management
  const openEjercicioModal = useCallback((diaIndex: number) => {
    setCurrentDiaIndex(diaIndex);
    setEjercicioSearch('');
    setShowEjercicioModal(true);
  }, []);

  const addEjercicioToDia = useCallback(
    (ejercicio: Ejercicio) => {
      if (currentDiaIndex === null) return;

      setDias((prev) =>
        prev.map((dia, i) => {
          if (i !== currentDiaIndex) return dia;
          const newEj: EjercicioForm = {
            ejercicio_id: ejercicio.id,
            nombre: ejercicio.nombre,
            orden: dia.ejercicios.length + 1,
            etapa: ejercicio.etapas?.[0] || 'Principal',
            series: 3,
            repeticiones: '10',
            descanso: 90,
            intensidad_tipo: 'rir',
            intensidad_valor: '2',
            observaciones: '',
          };
          return { ...dia, ejercicios: [...dia.ejercicios, newEj] };
        })
      );
      setShowEjercicioModal(false);
    },
    [currentDiaIndex]
  );

  const removeEjercicio = useCallback((diaIndex: number, ejIndex: number) => {
    setDias((prev) =>
      prev.map((dia, i) => {
        if (i !== diaIndex) return dia;
        const updated = dia.ejercicios.filter((_, j) => j !== ejIndex);
        return {
          ...dia,
          ejercicios: updated.map((e, idx) => ({ ...e, orden: idx + 1 })),
        };
      })
    );
    setEditingEjercicio(null);
  }, []);

  const updateEjercicio = useCallback(
    (diaIndex: number, ejIndex: number, updates: Partial<EjercicioForm>) => {
      setDias((prev) =>
        prev.map((dia, i) => {
          if (i !== diaIndex) return dia;
          return {
            ...dia,
            ejercicios: dia.ejercicios.map((ej, j) =>
              j === ejIndex ? { ...ej, ...updates } : ej
            ),
          };
        })
      );
    },
    []
  );

  const moveEjercicio = useCallback(
    (diaIndex: number, ejIndex: number, direction: 'up' | 'down') => {
      setDias((prev) =>
        prev.map((dia, i) => {
          if (i !== diaIndex) return dia;
          const ejercicios = [...dia.ejercicios];
          const targetIndex = direction === 'up' ? ejIndex - 1 : ejIndex + 1;
          if (targetIndex < 0 || targetIndex >= ejercicios.length) return dia;
          [ejercicios[ejIndex], ejercicios[targetIndex]] = [ejercicios[targetIndex], ejercicios[ejIndex]];
          return {
            ...dia,
            ejercicios: ejercicios.map((e, idx) => ({ ...e, orden: idx + 1 })),
          };
        })
      );
    },
    []
  );

  // Copy exercises from one dia to another
  const copyDia = useCallback((sourceDiaIndex: number) => {
    setDias((prev) => {
      const sourceDia = prev[sourceDiaIndex];
      const newDia: DiaForm = {
        numero: prev.length + 1,
        nombre: `${sourceDia.nombre} (copia)`,
        logica_entrenamiento: sourceDia.logica_entrenamiento,
        observaciones: sourceDia.observaciones,
        expanded: true,
        ejercicios: sourceDia.ejercicios.map((ej) => ({ ...ej })),
      };
      const updated = prev.map((d) => ({ ...d, expanded: false }));
      return [...updated, newDia];
    });
  }, []);

  // Filter exercises for modal
  const filteredEjercicios = ejercicios.filter((ej) =>
    ej.nombre.toLowerCase().includes(ejercicioSearch.toLowerCase()) ||
    ej.nombre_alternativo?.toLowerCase().includes(ejercicioSearch.toLowerCase()) ||
    ej.grupos_musculares?.some((g) => g.toLowerCase().includes(ejercicioSearch.toLowerCase()))
  );

  if (!isNew && isLoadingPlan) {
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
          <ArrowLeft className="w-5 h-5" />
          Volver a planes
        </button>

        <h1 className="text-3xl font-bold mb-2">
          {isNew ? 'Nuevo Plan Simple' : 'Editar Plan Simple'}
        </h1>
        {entrenado && (
          <p className="text-purple-100">
            Para: {entrenado.nombre} {entrenado.apellido}
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
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success message */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-green-50 text-green-700 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Plan guardado correctamente. Redirigiendo...</span>
        </div>
      )}

      {/* Plan info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion del Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del plan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Plan de fuerza - Mes 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo general</label>
            <textarea
              value={objetivoGeneral}
              onChange={(e) => setObjetivoGeneral(e.target.value)}
              rows={2}
              placeholder="Describe el objetivo principal del plan..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Dias */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Dias de entrenamiento
            {dias.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">({dias.length})</span>
            )}
          </h2>
          <button
            onClick={addDia}
            disabled={dias.length >= 14}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Agregar dia
          </button>
        </div>

        {dias.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Sin dias de entrenamiento</h3>
            <p className="text-gray-500 mb-4">Agrega tu primer dia para comenzar a armar el plan</p>
            <button
              onClick={addDia}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Agregar primer dia
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {dias.map((dia, diaIndex) => (
              <div key={diaIndex} className="bg-white rounded-xl shadow-sm overflow-hidden border-l-4 border-purple-500">
                {/* Dia header */}
                <div
                  className="p-4 bg-purple-50 flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors"
                  onClick={() => toggleDia(diaIndex)}
                >
                  <div className="flex items-center gap-4">
                    {dia.expanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {dia.nombre || `Dia ${dia.numero}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {dia.ejercicios.length} ejercicio{dia.ejercicios.length !== 1 ? 's' : ''}
                        {dia.logica_entrenamiento && ` \u2022 ${dia.logica_entrenamiento}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyDia(diaIndex);
                      }}
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-100 rounded transition-colors"
                      title="Duplicar dia"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Eliminar este dia y todos sus ejercicios?')) {
                          removeDia(diaIndex);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar dia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dia content (expanded) */}
                {dia.expanded && (
                  <div className="p-4 border-t space-y-4">
                    {/* Dia info fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del dia</label>
                        <input
                          type="text"
                          value={dia.nombre}
                          onChange={(e) => updateDia(diaIndex, { nombre: e.target.value })}
                          placeholder="Ej: Tren superior"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Logica de entrenamiento</label>
                        <input
                          type="text"
                          value={dia.logica_entrenamiento}
                          onChange={(e) => updateDia(diaIndex, { logica_entrenamiento: e.target.value })}
                          placeholder="Ej: Push / Pull / Legs"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Exercises list */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Ejercicios</h4>
                        <button
                          onClick={() => openEjercicioModal(diaIndex)}
                          className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar ejercicio
                        </button>
                      </div>

                      {dia.ejercicios.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                          <p className="text-sm text-gray-400 mb-2">Sin ejercicios</p>
                          <button
                            onClick={() => openEjercicioModal(diaIndex)}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                          >
                            Agregar primer ejercicio
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {dia.ejercicios.map((ejercicio, ejIndex) => (
                            <div key={ejIndex} className="bg-gray-50 rounded-lg overflow-hidden">
                              {/* Exercise row */}
                              <div
                                className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() =>
                                  setEditingEjercicio(
                                    editingEjercicio?.dia === diaIndex && editingEjercicio?.ejercicio === ejIndex
                                      ? null
                                      : { dia: diaIndex, ejercicio: ejIndex }
                                  )
                                }
                              >
                                {/* Drag handle / order */}
                                <div className="flex flex-col items-center gap-0.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveEjercicio(diaIndex, ejIndex, 'up');
                                    }}
                                    disabled={ejIndex === 0}
                                    className="p-0.5 text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                                    {ejercicio.orden}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveEjercicio(diaIndex, ejIndex, 'down');
                                    }}
                                    disabled={ejIndex === dia.ejercicios.length - 1}
                                    className="p-0.5 text-gray-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Exercise info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {ejercicio.nombre}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {ejercicio.series}x{ejercicio.repeticiones || '?'}{' '}
                                    {ejercicio.descanso > 0 && `\u2022 ${ejercicio.descanso}s desc.`}{' '}
                                    {ejercicio.intensidad_tipo && ejercicio.intensidad_valor && (
                                      <>
                                        {'\u2022'} {ejercicio.intensidad_tipo.toUpperCase()} {ejercicio.intensidad_valor}
                                      </>
                                    )}
                                  </p>
                                </div>

                                {/* Delete button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeEjercicio(diaIndex, ejIndex);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Exercise edit panel */}
                              {editingEjercicio?.dia === diaIndex &&
                                editingEjercicio?.ejercicio === ejIndex && (
                                  <div className="p-3 border-t bg-white space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Series</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={ejercicio.series}
                                          onChange={(e) =>
                                            updateEjercicio(diaIndex, ejIndex, {
                                              series: parseInt(e.target.value) || 1,
                                            })
                                          }
                                          className="w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Reps</label>
                                        <input
                                          type="text"
                                          value={ejercicio.repeticiones}
                                          onChange={(e) =>
                                            updateEjercicio(diaIndex, ejIndex, {
                                              repeticiones: e.target.value,
                                            })
                                          }
                                          placeholder="8-10"
                                          className="w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Desc (s)</label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="15"
                                          value={ejercicio.descanso}
                                          onChange={(e) =>
                                            updateEjercicio(diaIndex, ejIndex, {
                                              descanso: parseInt(e.target.value) || 0,
                                            })
                                          }
                                          className="w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Intensidad</label>
                                        <select
                                          value={ejercicio.intensidad_tipo}
                                          onChange={(e) =>
                                            updateEjercicio(diaIndex, ejIndex, {
                                              intensidad_tipo: e.target.value,
                                            })
                                          }
                                          className="w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                          onChange={(e) =>
                                            updateEjercicio(diaIndex, ejIndex, {
                                              intensidad_valor: e.target.value,
                                            })
                                          }
                                          className="w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">Etapa</label>
                                      <select
                                        value={ejercicio.etapa}
                                        onChange={(e) =>
                                          updateEjercicio(diaIndex, ejIndex, {
                                            etapa: e.target.value,
                                          })
                                        }
                                        className="w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      >
                                        <option value="Movilidad">Movilidad</option>
                                        <option value="Calentamiento">Calentamiento</option>
                                        <option value="Activacion">Activacion</option>
                                        <option value="Zona media">Zona media / Core</option>
                                        <option value="Principal">Principal</option>
                                        <option value="Accesorios">Accesorios</option>
                                        <option value="Enfriamiento">Enfriamiento</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">Observaciones</label>
                                      <input
                                        type="text"
                                        value={ejercicio.observaciones}
                                        onChange={(e) =>
                                          updateEjercicio(diaIndex, ejIndex, {
                                            observaciones: e.target.value,
                                          })
                                        }
                                        placeholder="Notas adicionales..."
                                        className="w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dia observaciones */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones del dia</label>
                      <input
                        type="text"
                        value={dia.observaciones}
                        onChange={(e) => updateDia(diaIndex, { observaciones: e.target.value })}
                        placeholder="Notas generales para este dia..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with actions */}
      <div className="sticky bottom-0 bg-white border-t p-4 -mx-6 -mb-6 mt-6 flex justify-between gap-3">
        <div className="text-sm text-gray-500 flex items-center">
          {dias.length > 0 && (
            <span>
              {dias.length} dia{dias.length !== 1 ? 's' : ''} \u2022{' '}
              {dias.reduce((acc, d) => acc + d.ejercicios.length, 0)} ejercicios total
            </span>
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
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !nombre || !entrenadoId}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Guardando...' : 'Guardar Plan'}
          </button>
        </div>
      </div>

      {/* Exercise picker modal */}
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
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar ejercicio..."
                  value={ejercicioSearch}
                  onChange={(e) => setEjercicioSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              {filteredEjercicios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No se encontraron ejercicios</p>
                  <p className="text-sm">Proba con otro termino de busqueda</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filteredEjercicios.map((ejercicio) => (
                    <button
                      key={ejercicio.id}
                      onClick={() => addEjercicioToDia(ejercicio)}
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
                          {ejercicio.grupos_musculares?.join(', ') || ejercicio.etapas?.join(', ') || 'General'}
                        </p>
                      </div>
                      <Plus className="w-5 h-5 text-gray-400" />
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
    </div>
  );
}
