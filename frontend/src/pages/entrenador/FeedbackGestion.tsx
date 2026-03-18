import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Entrenado {
  id: number;
  nombre: string;
  apellido: string;
  foto: string | null;
}

interface Feedback {
  id: number;
  entrenado: Entrenado;
  entrenador: {
    id: number;
    nombre: string;
    apellido: string;
  };
  tipo: 'progreso' | 'actitud' | 'asistencia' | 'tecnica' | 'otro';
  contenido: string;
  privado: boolean;
  created_at: string;
}

const tipoLabels: Record<string, { label: string; color: string }> = {
  progreso: { label: 'Progreso', color: 'bg-green-100 text-green-800' },
  actitud: { label: 'Actitud', color: 'bg-blue-100 text-blue-800' },
  asistencia: { label: 'Asistencia', color: 'bg-yellow-100 text-yellow-800' },
  tecnica: { label: 'Técnica', color: 'bg-purple-100 text-purple-800' },
  otro: { label: 'Otro', color: 'bg-gray-100 text-gray-800' },
};

export default function FeedbackGestion() {
  const queryClient = useQueryClient();
  const [filtroEntrenado, setFiltroEntrenado] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroPrivado, setFiltroPrivado] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [formData, setFormData] = useState({
    entrenado_id: '',
    tipo: 'progreso',
    contenido: '',
    privado: false,
  });

  const { data: feedbackList, isLoading } = useQuery({
    queryKey: ['feedback', filtroEntrenado, filtroTipo, filtroPrivado],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtroEntrenado) params.append('entrenado_id', filtroEntrenado);
      if (filtroTipo) params.append('tipo', filtroTipo);
      if (filtroPrivado) params.append('privado', filtroPrivado);
      const response = await api.get(`/feedbacks?${params.toString()}`);
      return response.data.data as Feedback[];
    },
  });

  const { data: entrenados } = useQuery({
    queryKey: ['entrenados-list'],
    queryFn: async () => {
      const response = await api.get('/entrenados?limit=100');
      return response.data.data as Entrenado[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post(`/entrenados/${data.entrenado_id}/feedbacks`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      closeModal();
      toast.success('Feedback creado correctamente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await api.put(`/feedbacks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      closeModal();
      toast.success('Feedback actualizado correctamente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/feedbacks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast.success('Feedback eliminado correctamente');
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingFeedback(null);
    setFormData({
      entrenado_id: '',
      tipo: 'progreso',
      contenido: '',
      privado: false,
    });
  };

  const openNewFeedback = () => {
    setEditingFeedback(null);
    setFormData({
      entrenado_id: '',
      tipo: 'progreso',
      contenido: '',
      privado: false,
    });
    setShowModal(true);
  };

  const openEditFeedback = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setFormData({
      entrenado_id: feedback.entrenado.id.toString(),
      tipo: feedback.tipo,
      contenido: feedback.contenido,
      privado: feedback.privado,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFeedback) {
      updateMutation.mutate({ id: editingFeedback.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar este feedback?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Agrupar feedback por entrenado
  const feedbackPorEntrenado = feedbackList?.reduce((acc, fb) => {
    const key = fb.entrenado.id;
    if (!acc[key]) {
      acc[key] = {
        entrenado: fb.entrenado,
        feedbacks: [],
      };
    }
    acc[key].feedbacks.push(fb);
    return acc;
  }, {} as Record<number, { entrenado: Entrenado; feedbacks: Feedback[] }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
          <p className="text-gray-600">Gestión de feedback de todos los entrenados</p>
        </div>
        <button
          onClick={openNewFeedback}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Feedback
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entrenado
            </label>
            <select
              value={filtroEntrenado}
              onChange={(e) => setFiltroEntrenado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {entrenados?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre} {e.apellido}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {Object.entries(tipoLabels).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visibilidad
            </label>
            <select
              value={filtroPrivado}
              onChange={(e) => setFiltroPrivado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="0">Público</option>
              <option value="1">Privado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Object.entries(tipoLabels).map(([key, { label, color }]) => {
          const count = feedbackList?.filter((f) => f.tipo === key).length || 0;
          return (
            <div key={key} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${color}`}>
                {label}
              </span>
              <p className="mt-2 text-2xl font-bold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Lista de feedback */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">Cargando feedback...</p>
        </div>
      ) : !feedbackPorEntrenado || Object.keys(feedbackPorEntrenado).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-gray-500">No hay feedback registrado</p>
          <button
            onClick={openNewFeedback}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Crear primer feedback
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(feedbackPorEntrenado).map(({ entrenado, feedbacks }) => (
            <div key={entrenado.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Header del entrenado */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <Link
                  to={`/entrenador/entrenados/${entrenado.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {entrenado.foto ? (
                    <img
                      src={entrenado.foto}
                      alt={entrenado.nombre}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {entrenado.nombre.charAt(0)}{entrenado.apellido.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {entrenado.nombre} {entrenado.apellido}
                    </p>
                    <p className="text-sm text-gray-500">
                      {feedbacks.length} feedback{feedbacks.length !== 1 && 's'}
                    </p>
                  </div>
                </Link>
              </div>

              {/* Lista de feedbacks */}
              <div className="divide-y divide-gray-100">
                {feedbacks.map((feedback) => (
                  <div key={feedback.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${tipoLabels[feedback.tipo]?.color || tipoLabels.otro.color}`}>
                            {tipoLabels[feedback.tipo]?.label || 'Otro'}
                          </span>
                          {feedback.privado && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Privado
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(feedback.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {feedback.contenido}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Por: {feedback.entrenador.nombre} {feedback.entrenador.apellido}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditFeedback(feedback)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(feedback.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingFeedback ? 'Editar Feedback' : 'Nuevo Feedback'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entrenado *
                </label>
                <select
                  value={formData.entrenado_id}
                  onChange={(e) => setFormData({ ...formData, entrenado_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!!editingFeedback}
                >
                  <option value="">Seleccionar entrenado</option>
                  {entrenados?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre} {e.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {Object.entries(tipoLabels).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenido *
                </label>
                <textarea
                  value={formData.contenido}
                  onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Escribe el feedback..."
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="privado"
                  checked={formData.privado}
                  onChange={(e) => setFormData({ ...formData, privado: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="privado" className="text-sm text-gray-700">
                  Privado (solo visible para entrenadores)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Guardando...'
                    : editingFeedback
                    ? 'Actualizar'
                    : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
