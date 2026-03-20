import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { AxiosError } from 'axios';

interface HorarioGym {
  id: number;
  dia_semana: number;
  hora_apertura: string | null;
  hora_cierre: string | null;
  cerrado: boolean;
  nombre_dia: string;
  horario_formateado: string;
}

interface DiaEspecial {
  id: number;
  fecha: string;
  titulo: string;
  descripcion: string | null;
  tipo: 'feriado' | 'cierre' | 'horario_especial' | 'evento';
  hora_apertura: string | null;
  hora_cierre: string | null;
  cerrado: boolean;
  color: string | null;
}

const diasSemana = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

const tipoLabels: Record<string, { label: string; color: string }> = {
  feriado: { label: 'Feriado', color: 'bg-red-100 text-red-800' },
  cierre: { label: 'Cierre', color: 'bg-gray-100 text-gray-800' },
  horario_especial: { label: 'Horario especial', color: 'bg-yellow-100 text-yellow-800' },
  evento: { label: 'Evento', color: 'bg-purple-100 text-purple-800' },
};

interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
}

export default function CalendarioGestion() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'horarios' | 'especiales'>('horarios');
  const [showModal, setShowModal] = useState(false);
  const [editingDia, setEditingDia] = useState<DiaEspecial | null>(null);
  const [horarios, setHorarios] = useState<HorarioGym[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fecha: '',
    titulo: '',
    descripcion: '',
    tipo: 'feriado' as DiaEspecial['tipo'],
    hora_apertura: '',
    hora_cierre: '',
    cerrado: true,
    color: '#ef4444',
  });

  // Cargar horarios regulares
  const { isLoading: loadingHorarios } = useQuery({
    queryKey: ['horarios-gym'],
    queryFn: async () => {
      const response = await api.get('/calendario/horarios');
      setHorarios(response.data.data);
      return response.data.data as HorarioGym[];
    },
  });

  // Cargar días especiales
  const { data: diasEspeciales, isLoading: loadingDias } = useQuery({
    queryKey: ['dias-especiales'],
    queryFn: async () => {
      const response = await api.get('/calendario/dias-especiales');
      return response.data.data as DiaEspecial[];
    },
  });

  // Guardar horarios
  const saveHorariosMutation = useMutation({
    mutationFn: async (data: { horarios: Partial<HorarioGym>[] }) => {
      const response = await api.put('/calendario/horarios', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios-gym'] });
      setError(null);
      toast.success('Horarios guardados correctamente');
    },
    onError: (err: AxiosError<ApiError>) => {
      const message = err.response?.data?.message
        || Object.values(err.response?.data?.errors || {})[0]?.[0]
        || 'Error al guardar los horarios';
      setError(message);
    },
  });

  // Crear día especial
  const createDiaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/calendario/dias-especiales', {
        ...data,
        hora_apertura: data.hora_apertura || null,
        hora_cierre: data.hora_cierre || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dias-especiales'] });
      setError(null);
      closeModal();
      toast.success('Día especial creado correctamente');
    },
    onError: (err: AxiosError<ApiError>) => {
      const message = err.response?.data?.message
        || Object.values(err.response?.data?.errors || {})[0]?.[0]
        || 'Error al crear el día especial';
      setError(message);
    },
  });

  // Actualizar día especial
  const updateDiaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await api.put(`/calendario/dias-especiales/${id}`, {
        ...data,
        hora_apertura: data.hora_apertura || null,
        hora_cierre: data.hora_cierre || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dias-especiales'] });
      setError(null);
      closeModal();
      toast.success('Día especial actualizado correctamente');
    },
    onError: (err: AxiosError<ApiError>) => {
      const message = err.response?.data?.message
        || Object.values(err.response?.data?.errors || {})[0]?.[0]
        || 'Error al actualizar el día especial';
      setError(message);
    },
  });

  // Eliminar día especial
  const deleteDiaMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/calendario/dias-especiales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dias-especiales'] });
      toast.success('Día especial eliminado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al eliminar el día especial';
      toast.error(msg);
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingDia(null);
    setFormData({
      fecha: '',
      titulo: '',
      descripcion: '',
      tipo: 'feriado',
      hora_apertura: '',
      hora_cierre: '',
      cerrado: true,
      color: '#ef4444',
    });
  };

  const openNewDia = () => {
    setEditingDia(null);
    setFormData({
      fecha: '',
      titulo: '',
      descripcion: '',
      tipo: 'feriado',
      hora_apertura: '',
      hora_cierre: '',
      cerrado: true,
      color: '#ef4444',
    });
    setShowModal(true);
  };

  const openEditDia = (dia: DiaEspecial) => {
    setEditingDia(dia);
    setFormData({
      fecha: dia.fecha,
      titulo: dia.titulo,
      descripcion: dia.descripcion || '',
      tipo: dia.tipo,
      hora_apertura: dia.hora_apertura || '',
      hora_cierre: dia.hora_cierre || '',
      cerrado: dia.cerrado,
      color: dia.color || '#ef4444',
    });
    setShowModal(true);
  };

  const handleHorarioChange = (index: number, field: string, value: string | boolean) => {
    const newHorarios = [...horarios];
    newHorarios[index] = { ...newHorarios[index], [field]: value };

    // Si se marca como cerrado, limpiar horarios
    if (field === 'cerrado' && value === true) {
      newHorarios[index].hora_apertura = null;
      newHorarios[index].hora_cierre = null;
    }

    setHorarios(newHorarios);
  };

  const handleSaveHorarios = () => {
    saveHorariosMutation.mutate({
      horarios: horarios.map(h => ({
        dia_semana: h.dia_semana,
        hora_apertura: h.hora_apertura || null,
        hora_cierre: h.hora_cierre || null,
        cerrado: h.cerrado,
      })),
    });
  };

  const handleSubmitDia = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDia) {
      updateDiaMutation.mutate({ id: editingDia.id, data: formData });
    } else {
      createDiaMutation.mutate(formData);
    }
  };

  const handleDeleteDia = (id: number) => {
    if (confirm('¿Eliminar este día especial?')) {
      deleteDiaMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Agrupar días especiales por mes
  const diasPorMes = diasEspeciales?.reduce((acc, dia) => {
    const fecha = new Date(dia.fecha + 'T00:00:00');
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const label = fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    if (!acc[key]) {
      acc[key] = { label, dias: [] };
    }
    acc[key].dias.push(dia);
    return acc;
  }, {} as Record<string, { label: string; dias: DiaEspecial[] }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendario del Gimnasio</h1>
        <p className="text-gray-600">Gestiona horarios regulares y días especiales</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('horarios')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'horarios'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Horarios Regulares
        </button>
        <button
          onClick={() => setActiveTab('especiales')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'especiales'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Días Especiales
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Horarios regulares */}
      {activeTab === 'horarios' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loadingHorarios ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Cargando horarios...</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {horarios.map((horario, index) => (
                  <div key={horario.dia_semana} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-28">
                      <span className="font-medium text-gray-900">{diasSemana[horario.dia_semana]}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={horario.cerrado}
                        onChange={(e) => handleHorarioChange(index, 'cerrado', e.target.checked)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        id={`cerrado-${horario.dia_semana}`}
                      />
                      <label htmlFor={`cerrado-${horario.dia_semana}`} className="text-sm text-gray-600">
                        Cerrado
                      </label>
                    </div>

                    {!horario.cerrado && (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={horario.hora_apertura || ''}
                          onChange={(e) => handleHorarioChange(index, 'hora_apertura', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-gray-400">a</span>
                        <input
                          type="time"
                          value={horario.hora_cierre || ''}
                          onChange={(e) => handleHorarioChange(index, 'hora_cierre', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {horario.cerrado && (
                      <span className="text-sm text-red-500 font-medium">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={handleSaveHorarios}
                  disabled={saveHorariosMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saveHorariosMutation.isPending ? 'Guardando...' : 'Guardar Horarios'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Días especiales */}
      {activeTab === 'especiales' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={openNewDia}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Día Especial
            </button>
          </div>

          {loadingDias ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <p className="text-gray-500">Cargando días especiales...</p>
            </div>
          ) : !diasEspeciales || diasEspeciales.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">No hay días especiales registrados</p>
              <button
                onClick={openNewDia}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Agregar primer día especial
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(diasPorMes || {}).map(([key, { label, dias }]) => (
                <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 capitalize">{label}</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {dias.map((dia) => (
                      <div key={dia.id} className="p-4 flex items-center gap-4">
                        <div
                          className="w-2 h-12 rounded-full"
                          style={{ backgroundColor: dia.color || '#ef4444' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{dia.titulo}</h4>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tipoLabels[dia.tipo]?.color || 'bg-gray-100 text-gray-800'}`}>
                              {tipoLabels[dia.tipo]?.label || dia.tipo}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 capitalize">{formatDate(dia.fecha)}</p>
                          {dia.descripcion && (
                            <p className="text-sm text-gray-600 mt-1">{dia.descripcion}</p>
                          )}
                          <p className="text-sm text-gray-400 mt-1">
                            {dia.cerrado
                              ? 'Cerrado'
                              : dia.hora_apertura && dia.hora_cierre
                              ? `${dia.hora_apertura.slice(0, 5)} - ${dia.hora_cierre.slice(0, 5)}`
                              : 'Horario normal'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditDia(dia)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteDia(dia.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal crear/editar día especial */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingDia ? 'Editar Día Especial' : 'Nuevo Día Especial'}
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

            <form onSubmit={handleSubmitDia} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!!editingDia}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ej: Feriado Nacional"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detalles adicionales..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as DiaEspecial['tipo'] })}
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
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cerrado"
                    checked={formData.cerrado}
                    onChange={(e) => setFormData({ ...formData, cerrado: e.target.checked })}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="cerrado" className="text-sm font-medium text-gray-700">
                    Gimnasio cerrado
                  </label>
                </div>

                {!formData.cerrado && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora apertura
                      </label>
                      <input
                        type="time"
                        value={formData.hora_apertura}
                        onChange={(e) => setFormData({ ...formData, hora_apertura: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora cierre
                      </label>
                      <input
                        type="time"
                        value={formData.hora_cierre}
                        onChange={(e) => setFormData({ ...formData, hora_cierre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {formData.cerrado
                    ? 'El gimnasio estará cerrado este día'
                    : 'Deja vacío para usar el horario normal'}
                </p>
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
                  disabled={createDiaMutation.isPending || updateDiaMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createDiaMutation.isPending || updateDiaMutation.isPending
                    ? 'Guardando...'
                    : editingDia
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
