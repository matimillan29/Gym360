import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Entrenado {
  id: number;
  nombre: string;
  apellido: string;
}

interface Evaluacion {
  id: number;
  entrenado: Entrenado;
  tipo: string;
  nombre: string;
  descripcion?: string;
  valor: number;
  unidad: string;
  fecha: string;
  created_at: string;
}

interface EvaluacionForm {
  entrenado_id: number | '';
  tipo: string;
  nombre: string;
  descripcion: string;
  valor: string;
  unidad: string;
  fecha: string;
}

const TIPOS_EVALUACION = [
  { value: 'fuerza_maxima', label: 'Fuerza Máxima (1RM)', unidadDefault: 'kg' },
  { value: 'resistencia', label: 'Test de Resistencia', unidadDefault: 'reps' },
  { value: 'aerobico', label: 'Test Aeróbico (Cooper)', unidadDefault: 'm' },
  { value: 'flexibilidad', label: 'Test de Flexibilidad', unidadDefault: 'cm' },
  { value: 'composicion', label: 'Composición Corporal', unidadDefault: '%' },
  { value: 'personalizado', label: 'Personalizado', unidadDefault: '' },
];

const initialForm: EvaluacionForm = {
  entrenado_id: '',
  tipo: '',
  nombre: '',
  descripcion: '',
  valor: '',
  unidad: '',
  fecha: new Date().toISOString().split('T')[0],
};

export default function EvaluacionesList() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EvaluacionForm>(initialForm);
  const [filterEntrenado, setFilterEntrenado] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('');

  // Fetch evaluaciones
  const { data: evaluaciones = [], isLoading } = useQuery<Evaluacion[]>({
    queryKey: ['evaluaciones', filterEntrenado, filterTipo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterEntrenado) params.append('entrenado_id', filterEntrenado);
      if (filterTipo) params.append('tipo', filterTipo);
      const response = await api.get(`/evaluaciones?${params.toString()}`);
      return response.data.data || response.data || [];
    },
  });

  // Fetch entrenados para el selector
  const { data: entrenados = [] } = useQuery<Entrenado[]>({
    queryKey: ['entrenados-select'],
    queryFn: async () => {
      const response = await api.get('/entrenados?estado=activo');
      return response.data.data || response.data || [];
    },
  });

  // Mutation para crear/editar evaluación
  const saveMutation = useMutation({
    mutationFn: async (data: EvaluacionForm) => {
      const payload = {
        ...data,
        valor: parseFloat(data.valor),
      };
      if (editingId) {
        return api.put(`/evaluaciones/${editingId}`, payload);
      }
      return api.post(`/entrenados/${data.entrenado_id}/evaluaciones`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluaciones'] });
      closeModal();
      toast.success(editingId ? 'Evaluación actualizada correctamente' : 'Evaluación creada correctamente');
    },
  });

  // Mutation para eliminar
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/evaluaciones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluaciones'] });
      toast.success('Evaluación eliminada correctamente');
    },
  });

  const openModal = (evaluacion?: Evaluacion) => {
    if (evaluacion) {
      setEditingId(evaluacion.id);
      setForm({
        entrenado_id: evaluacion.entrenado.id,
        tipo: evaluacion.tipo,
        nombre: evaluacion.nombre,
        descripcion: evaluacion.descripcion || '',
        valor: evaluacion.valor.toString(),
        unidad: evaluacion.unidad,
        fecha: evaluacion.fecha.split('T')[0],
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleTipoChange = (tipo: string) => {
    const tipoInfo = TIPOS_EVALUACION.find((t) => t.value === tipo);
    setForm({
      ...form,
      tipo,
      unidad: tipoInfo?.unidadDefault || form.unidad,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.entrenado_id || !form.nombre || !form.valor) return;
    saveMutation.mutate(form);
  };

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      fuerza_maxima: 'bg-red-100 text-red-700',
      resistencia: 'bg-orange-100 text-orange-700',
      aerobico: 'bg-blue-100 text-blue-700',
      flexibilidad: 'bg-green-100 text-green-700',
      composicion: 'bg-purple-100 text-purple-700',
      personalizado: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      fuerza_maxima: 'Fuerza',
      resistencia: 'Resistencia',
      aerobico: 'Aeróbico',
      flexibilidad: 'Flexibilidad',
      composicion: 'Composición',
      personalizado: 'Personalizado',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tipo] || colors.personalizado}`}>
        {labels[tipo] || tipo}
      </span>
    );
  };

  // Agrupar evaluaciones por entrenado
  const groupedByEntrenado = evaluaciones.reduce((acc, ev) => {
    const key = ev.entrenado.id;
    if (!acc[key]) {
      acc[key] = {
        entrenado: ev.entrenado,
        evaluaciones: [],
      };
    }
    acc[key].evaluaciones.push(ev);
    return acc;
  }, {} as Record<number, { entrenado: Entrenado; evaluaciones: Evaluacion[] }>);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-teal-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Evaluaciones</h1>
            <p className="text-teal-100 mt-1">Gestión de tests y evaluaciones de rendimiento</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-white text-teal-700 rounded-lg hover:bg-teal-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Evaluación
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Entrenado</label>
            <select
              value={filterEntrenado}
              onChange={(e) => setFilterEntrenado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Todos los entrenados</option>
              {entrenados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre} {e.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              {TIPOS_EVALUACION.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {(filterEntrenado || filterTipo) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterEntrenado('');
                  setFilterTipo('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de evaluaciones */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <p className="text-gray-500">Cargando evaluaciones...</p>
        </div>
      ) : Object.keys(groupedByEntrenado).length > 0 ? (
        <div className="space-y-6">
          {Object.values(groupedByEntrenado).map(({ entrenado, evaluaciones: evs }) => (
            <div key={entrenado.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
                  {entrenado.nombre[0]}{entrenado.apellido[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {entrenado.nombre} {entrenado.apellido}
                  </h3>
                  <p className="text-sm text-gray-500">{evs.length} evaluaciones</p>
                </div>
              </div>

              <div className="divide-y">
                {evs.map((evaluacion) => (
                  <div key={evaluacion.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                          <span className="text-lg font-bold text-teal-600">{evaluacion.valor}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{evaluacion.nombre}</h4>
                            {getTipoBadge(evaluacion.tipo)}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {evaluacion.valor} {evaluacion.unidad}
                            {evaluacion.descripcion && ` - ${evaluacion.descripcion}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(evaluacion.fecha).toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(evaluacion)}
                          className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar esta evaluación?')) {
                              deleteMutation.mutate(evaluacion.id);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay evaluaciones</h3>
          <p className="text-gray-500 mb-4">Creá la primera evaluación para tus entrenados</p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Nueva evaluación
          </button>
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingId ? 'Editar Evaluación' : 'Nueva Evaluación'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Entrenado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entrenado *
                  </label>
                  <select
                    value={form.entrenado_id}
                    onChange={(e) => setForm({ ...form, entrenado_id: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                    disabled={!!editingId}
                  >
                    <option value="">Seleccionar entrenado...</option>
                    {entrenados.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre} {e.apellido}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de evaluación
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => handleTipoChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {TIPOS_EVALUACION.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la evaluación *
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Press Banca 1RM, Test Cooper, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Valor y Unidad */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.valor}
                      onChange={(e) => setForm({ ...form, valor: e.target.value })}
                      placeholder="Ej: 100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad *
                    </label>
                    <input
                      type="text"
                      value={form.unidad}
                      onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                      placeholder="kg, reps, m, cm, %"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción / Notas
                  </label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    rows={3}
                    placeholder="Observaciones sobre la evaluación..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear evaluación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
