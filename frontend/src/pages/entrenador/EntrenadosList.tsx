import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { User } from '../../types';
import DateInput from '../../components/DateInput';

type EntrenadoStatus = 'activo' | 'baja_temporal' | 'inactivo';

// Mapeo de iconos de objetivo
const OBJETIVO_ICONS: Record<string, string> = {
  pesa: '🏋️',
  correr: '🏃',
  futbol: '⚽',
  volleyball: '🏐',
  tenis: '🎾',
  natacion: '🏊',
  ciclismo: '🚴',
  yoga: '🧘',
  boxeo: '🥊',
  baloncesto: '🏀',
  rugby: '🏉',
  escalada: '🧗',
  bajar_peso: '⬇️',
  musculo: '💪',
  salud: '❤️',
  flexibilidad: '🤸',
};

interface CreateEntrenadoForm {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  telefono: string;
  fecha_nacimiento: string;
  profesion?: string;
}

export default function EntrenadosList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EntrenadoStatus | 'todos'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingEntrenado, setEditingEntrenado] = useState<User | null>(null);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateEntrenadoForm>({
    nombre: '',
    apellido: '',
    email: '',
    dni: '',
    telefono: '',
    fecha_nacimiento: '',
    profesion: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['entrenados'],
    queryFn: async () => {
      const response = await api.get<{ data: User[] }>('/entrenados');
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateEntrenadoForm) => {
      const response = await api.post('/entrenados', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entrenados'] });
      setShowModal(false);
      resetForm();
      toast.success('Entrenado creado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al crear el entrenado';
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateEntrenadoForm> }) => {
      const response = await api.put(`/entrenados/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entrenados'] });
      setShowModal(false);
      setEditingEntrenado(null);
      resetForm();
      toast.success('Entrenado actualizado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al actualizar el entrenado';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/entrenados/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entrenados'] });
      toast.success('Entrenado eliminado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al eliminar el entrenado';
      toast.error(msg);
    },
  });

  const bajaMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/entrenados/${id}/baja-temporal`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entrenados'] });
      toast.success('Entrenado dado de baja correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al cambiar estado del entrenado';
      toast.error(msg);
    },
  });

  const reactivarMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/entrenados/${id}/reactivar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entrenados'] });
      toast.success('Entrenado reactivado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al cambiar estado del entrenado';
      toast.error(msg);
    },
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      dni: '',
      telefono: '',
      fecha_nacimiento: '',
      profesion: '',
    });
  };

  const handleEdit = (entrenado: User) => {
    setEditingEntrenado(entrenado);
    setFormData({
      nombre: entrenado.nombre,
      apellido: entrenado.apellido,
      email: entrenado.email,
      dni: entrenado.dni || '',
      telefono: entrenado.telefono || '',
      fecha_nacimiento: entrenado.fecha_nacimiento || '',
      profesion: entrenado.profesion || '',
    });
    setShowModal(true);
    setOpenMenu(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntrenado) {
      updateMutation.mutate({ id: editingEntrenado.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este entrenado?')) {
      deleteMutation.mutate(id);
    }
    setOpenMenu(null);
  };

  const entrenados = data || [];

  const filteredEntrenados = entrenados.filter(e => {
    const matchesSearch = search === '' ||
      `${e.nombre} ${e.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.dni?.includes(search);

    const matchesStatus = statusFilter === 'todos' || e.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: EntrenadoStatus) => {
    switch (status) {
      case 'activo':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Activo</span>;
      case 'baja_temporal':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Baja temporal</span>;
      case 'inactivo':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Inactivo</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrenados</h1>
          <p className="text-gray-500">{filteredEntrenados.length} clientes registrados</p>
        </div>
        <button
          onClick={() => {
            setEditingEntrenado(null);
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo entrenado
        </button>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, email o DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {(['todos', 'activo', 'baja_temporal', 'inactivo'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'todos' ? 'Todos' : status === 'baja_temporal' ? 'Baja' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Cargando entrenados...</p>
          </div>
        ) : filteredEntrenados.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 text-lg">No hay entrenados registrados</p>
            <p className="text-gray-400 text-sm mt-1">Comenzá agregando tu primer cliente</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar entrenado
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {filteredEntrenados.map((entrenado) => (
              <div key={entrenado.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {entrenado.foto ? (
                      <img src={entrenado.foto} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                        {entrenado.nombre.charAt(0)}{entrenado.apellido.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {entrenado.anamnesis?.icono_objetivo && OBJETIVO_ICONS[entrenado.anamnesis.icono_objetivo] && (
                        <span
                          className="text-xl"
                          title={entrenado.anamnesis.objetivos_principales || 'Objetivo'}
                        >
                          {OBJETIVO_ICONS[entrenado.anamnesis.icono_objetivo]}
                        </span>
                      )}
                      <Link
                        to={`/entrenador/entrenados/${entrenado.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {entrenado.nombre} {entrenado.apellido}
                      </Link>
                      {getStatusBadge(entrenado.estado)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {entrenado.email}
                      </span>
                      {entrenado.telefono && (
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {entrenado.telefono}
                        </span>
                      )}
                      {entrenado.fecha_nacimiento && (
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(entrenado.fecha_nacimiento)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/entrenador/entrenados/${entrenado.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === entrenado.id ? null : entrenado.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      {openMenu === entrenado.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                          <button
                            onClick={() => handleEdit(entrenado)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                          {entrenado.estado === 'activo' ? (
                            <button
                              onClick={() => {
                                bajaMutation.mutate(entrenado.id);
                                setOpenMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 flex items-center gap-2"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                              </svg>
                              Dar de baja
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                reactivarMutation.mutate(entrenado.id);
                                setOpenMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              Reactivar
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(entrenado.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingEntrenado ? 'Editar entrenado' : 'Nuevo entrenado'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingEntrenado(null);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
                  <input
                    type="text"
                    required
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento *</label>
                  <DateInput
                    value={formData.fecha_nacimiento}
                    onChange={(value) => setFormData({ ...formData, fecha_nacimiento: value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profesión</label>
                  <input
                    type="text"
                    value={formData.profesion}
                    onChange={(e) => setFormData({ ...formData, profesion: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEntrenado(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
