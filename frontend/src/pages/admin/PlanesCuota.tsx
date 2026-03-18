import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface PlanCuota {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: 'mensual_libre' | 'semanal_2x' | 'semanal_3x' | 'pack_clases' | 'personalizado';
  cantidad_accesos: number | null;
  duracion_dias: number;
  tipo_acceso: 'solo_musculacion' | 'solo_clases' | 'completo' | 'mixto';
  clases_semanales: number | null;
  precio: number;
  activo: boolean;
  entrenados_count?: number;
}

const tiposAcceso = [
  { value: 'completo', label: 'Completo', desc: 'Musculación + Actividades ilimitadas' },
  { value: 'solo_musculacion', label: 'Solo Musculación', desc: 'Sin acceso a actividades grupales' },
  { value: 'solo_clases', label: 'Solo Actividades', desc: 'Sin acceso a sala de musculación' },
  { value: 'mixto', label: 'Mixto', desc: 'Musculación + N actividades por semana' },
];

const tiposPlan = [
  { value: 'mensual_libre', label: 'Mensual Libre', desc: 'Acceso ilimitado por mes' },
  { value: 'semanal_2x', label: '2 veces por semana', desc: '8 accesos por mes' },
  { value: 'semanal_3x', label: '3 veces por semana', desc: '12 accesos por mes' },
  { value: 'pack_clases', label: 'Pack de actividades', desc: 'Cantidad fija de accesos' },
  { value: 'personalizado', label: 'Personalizado', desc: 'Configuración custom' },
];

export default function PlanesCuota() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanCuota | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'mensual_libre' as PlanCuota['tipo'],
    cantidad_accesos: null as number | null,
    duracion_dias: 30,
    tipo_acceso: 'completo' as PlanCuota['tipo_acceso'],
    clases_semanales: null as number | null,
    precio: 0,
    activo: true,
  });

  const { data: planes, isLoading } = useQuery<PlanCuota[]>({
    queryKey: ['planes-cuota'],
    queryFn: async () => {
      const response = await api.get('/planes-cuota');
      return response.data.data || response.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingPlan) {
        return api.put(`/planes-cuota/${editingPlan.id}`, data);
      }
      return api.post('/planes-cuota', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes-cuota'] });
      closeModal();
      toast.success(editingPlan ? 'Plan actualizado correctamente' : 'Plan creado correctamente');
    },
  });

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => {
      return api.put(`/planes-cuota/${id}`, { activo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes-cuota'] });
      toast.success('Estado del plan actualizado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/planes-cuota/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes-cuota'] });
      toast.success('Plan eliminado correctamente');
    },
  });

  const openModal = (plan?: PlanCuota) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        nombre: plan.nombre,
        descripcion: plan.descripcion || '',
        tipo: plan.tipo,
        cantidad_accesos: plan.cantidad_accesos,
        duracion_dias: plan.duracion_dias,
        tipo_acceso: plan.tipo_acceso || 'completo',
        clases_semanales: plan.clases_semanales,
        precio: plan.precio,
        activo: plan.activo,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        nombre: '',
        descripcion: '',
        tipo: 'mensual_libre',
        cantidad_accesos: null,
        duracion_dias: 30,
        tipo_acceso: 'completo',
        clases_semanales: null,
        precio: 0,
        activo: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlan(null);
  };

  const handleTipoChange = (tipo: PlanCuota['tipo']) => {
    setFormData((prev) => {
      const newData = { ...prev, tipo };
      // Auto-configurar según tipo
      switch (tipo) {
        case 'mensual_libre':
          newData.cantidad_accesos = null;
          newData.duracion_dias = 30;
          break;
        case 'semanal_2x':
          newData.cantidad_accesos = 8;
          newData.duracion_dias = 30;
          break;
        case 'semanal_3x':
          newData.cantidad_accesos = 12;
          newData.duracion_dias = 30;
          break;
        case 'pack_clases':
          newData.cantidad_accesos = 10;
          newData.duracion_dias = 60;
          break;
      }
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const getTipoLabel = (tipo: string) => {
    return tiposPlan.find((t) => t.value === tipo)?.label || tipo;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando planes...</p>
      </div>
    );
  }

  const planesActivos = planes?.filter((p) => p.activo) || [];
  const planesInactivos = planes?.filter((p) => !p.activo) || [];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Planes de Cuota</h1>
            <p className="text-emerald-100">Administrar los tipos de membresía del gimnasio</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Plan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{planesActivos.length}</p>
              <p className="text-xs text-gray-500">Planes activos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{planesInactivos.length}</p>
              <p className="text-xs text-gray-500">Inactivos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {planes?.reduce((acc, p) => acc + (p.entrenados_count || 0), 0) || 0}
              </p>
              <p className="text-xs text-gray-500">Entrenados activos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de planes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Planes configurados</h2>
        </div>

        {planes && planes.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {planes.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 flex items-center justify-between ${
                  !plan.activo ? 'bg-gray-50 opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    plan.activo ? 'bg-emerald-100' : 'bg-gray-200'
                  }`}>
                    <svg className={`w-6 h-6 ${plan.activo ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{plan.nombre}</h3>
                      {!plan.activo && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {getTipoLabel(plan.tipo)} •{' '}
                      {plan.cantidad_accesos ? `${plan.cantidad_accesos} accesos` : 'Ilimitado'} •{' '}
                      {plan.duracion_dias} días
                    </p>
                    {plan.descripcion && (
                      <p className="text-xs text-gray-400 mt-1">{plan.descripcion}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${plan.precio.toLocaleString()}
                    </p>
                    {plan.entrenados_count !== undefined && plan.entrenados_count > 0 && (
                      <p className="text-xs text-gray-500">{plan.entrenados_count} entrenados</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActivoMutation.mutate({ id: plan.id, activo: !plan.activo })}
                      className={`p-2 rounded-lg transition-colors ${
                        plan.activo
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={plan.activo ? 'Desactivar' : 'Activar'}
                    >
                      {plan.activo ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => openModal(plan)}
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {(plan.entrenados_count || 0) === 0 && (
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar este plan?')) {
                            deleteMutation.mutate(plan.id);
                          }
                        }}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay planes configurados</h3>
            <p className="text-gray-500 mb-4">Creá tu primer plan de membresía</p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear plan
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan de Cuota'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del plan *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ej: Plan Mensual Premium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de plan
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleTipoChange(e.target.value as PlanCuota['tipo'])}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {tiposPlan.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label} - {tipo.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad de accesos
                  </label>
                  <input
                    type="number"
                    value={formData.cantidad_accesos || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cantidad_accesos: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Ilimitado"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Dejar vacío para ilimitado</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración (días)
                  </label>
                  <input
                    type="number"
                    value={formData.duracion_dias}
                    onChange={(e) =>
                      setFormData({ ...formData, duracion_dias: parseInt(e.target.value) || 30 })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de acceso
                </label>
                <select
                  value={formData.tipo_acceso}
                  onChange={(e) => setFormData({ ...formData, tipo_acceso: e.target.value as PlanCuota['tipo_acceso'] })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {tiposAcceso.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label} - {tipo.desc}
                    </option>
                  ))}
                </select>
              </div>

              {(formData.tipo_acceso === 'mixto' || formData.tipo_acceso === 'solo_clases') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actividades por semana
                  </label>
                  <input
                    type="number"
                    value={formData.clases_semanales || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        clases_semanales: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder={formData.tipo_acceso === 'solo_clases' ? 'Cantidad de actividades' : 'Actividades adicionales'}
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cantidad máxima de actividades por semana
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.precio || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setFormData({ ...formData, precio: parseInt(value) || 0 });
                    }}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Descripción opcional del plan..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="activo" className="text-sm text-gray-700">
                  Plan activo (visible para asignar a entrenados)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
