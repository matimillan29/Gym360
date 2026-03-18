import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Negocio {
  id: number;
  nombre: string;
  logo: string | null;
}

interface Cupon {
  id: number;
  negocio_id: number;
  negocio: Negocio;
  titulo: string;
  descripcion: string | null;
  codigo: string | null;
  tipo_descuento: 'porcentaje' | 'monto_fijo' | 'especial';
  valor_descuento: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  es_cumpleanos: boolean;
  dias_validez_cumple: number | null;
  usos_maximos: number | null;
  activo: boolean;
  created_at: string;
}

interface Entrenado {
  id: number;
  nombre: string;
  apellido: string;
  foto: string | null;
}

const tipoDescuentoLabels: Record<string, string> = {
  porcentaje: 'Porcentaje',
  monto_fijo: 'Monto fijo',
  especial: 'Especial',
};

export default function CuponesGestion() {
  const queryClient = useQueryClient();
  const [filtroNegocio, setFiltroNegocio] = useState<string>('');
  const [filtroCumple, setFiltroCumple] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [cuponAsignar, setCuponAsignar] = useState<Cupon | null>(null);
  const [editingCupon, setEditingCupon] = useState<Cupon | null>(null);
  const [searchEntrenado, setSearchEntrenado] = useState('');
  const [formData, setFormData] = useState({
    negocio_id: '',
    titulo: '',
    descripcion: '',
    codigo: '',
    tipo_descuento: 'porcentaje',
    valor_descuento: '',
    fecha_inicio: '',
    fecha_fin: '',
    es_cumpleanos: false,
    dias_validez_cumple: '30',
    usos_maximos: '',
  });

  const { data: cupones, isLoading } = useQuery({
    queryKey: ['cupones', filtroNegocio, filtroCumple],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtroNegocio) params.append('negocio_id', filtroNegocio);
      if (filtroCumple) params.append('es_cumpleanos', filtroCumple);
      const response = await api.get(`/cupones?${params.toString()}`);
      return response.data.data as Cupon[];
    },
  });

  const { data: negocios } = useQuery({
    queryKey: ['negocios'],
    queryFn: async () => {
      const response = await api.get('/negocios');
      return response.data.data as Negocio[];
    },
  });

  const { data: entrenados } = useQuery({
    queryKey: ['entrenados-list'],
    queryFn: async () => {
      const response = await api.get('/entrenados?estado=activo');
      return response.data.data as Entrenado[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/cupones', {
        ...data,
        negocio_id: parseInt(data.negocio_id),
        valor_descuento: data.valor_descuento ? parseFloat(data.valor_descuento) : null,
        dias_validez_cumple: data.dias_validez_cumple ? parseInt(data.dias_validez_cumple) : null,
        usos_maximos: data.usos_maximos ? parseInt(data.usos_maximos) : null,
        fecha_inicio: data.fecha_inicio || null,
        fecha_fin: data.fecha_fin || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupones'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await api.put(`/cupones/${id}`, {
        ...data,
        valor_descuento: data.valor_descuento ? parseFloat(data.valor_descuento) : null,
        dias_validez_cumple: data.dias_validez_cumple ? parseInt(data.dias_validez_cumple) : null,
        usos_maximos: data.usos_maximos ? parseInt(data.usos_maximos) : null,
        fecha_inicio: data.fecha_inicio || null,
        fecha_fin: data.fecha_fin || null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupones'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/cupones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupones'] });
    },
  });

  const asignarMutation = useMutation({
    mutationFn: async ({ cuponId, entrenadoId }: { cuponId: number; entrenadoId: number }) => {
      const response = await api.post(`/cupones/${cuponId}/asignar`, {
        entrenado_id: entrenadoId,
        motivo: 'manual',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupones'] });
      setShowAsignarModal(false);
      setCuponAsignar(null);
    },
  });

  const asignarTodosMutation = useMutation({
    mutationFn: async (cuponId: number) => {
      const response = await api.post(`/cupones/${cuponId}/asignar-todos`, {
        motivo: 'promocion',
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cupones'] });
      toast.success(data.message);
    },
  });

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) => {
      const response = await api.put(`/cupones/${id}`, { activo });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupones'] });
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingCupon(null);
    setFormData({
      negocio_id: '',
      titulo: '',
      descripcion: '',
      codigo: '',
      tipo_descuento: 'porcentaje',
      valor_descuento: '',
      fecha_inicio: '',
      fecha_fin: '',
      es_cumpleanos: false,
      dias_validez_cumple: '30',
      usos_maximos: '',
    });
  };

  const openNew = () => {
    setEditingCupon(null);
    setFormData({
      negocio_id: '',
      titulo: '',
      descripcion: '',
      codigo: '',
      tipo_descuento: 'porcentaje',
      valor_descuento: '',
      fecha_inicio: '',
      fecha_fin: '',
      es_cumpleanos: false,
      dias_validez_cumple: '30',
      usos_maximos: '',
    });
    setShowModal(true);
  };

  const openEdit = (cupon: Cupon) => {
    setEditingCupon(cupon);
    setFormData({
      negocio_id: cupon.negocio_id.toString(),
      titulo: cupon.titulo,
      descripcion: cupon.descripcion || '',
      codigo: cupon.codigo || '',
      tipo_descuento: cupon.tipo_descuento,
      valor_descuento: cupon.valor_descuento?.toString() || '',
      fecha_inicio: cupon.fecha_inicio || '',
      fecha_fin: cupon.fecha_fin || '',
      es_cumpleanos: cupon.es_cumpleanos,
      dias_validez_cumple: cupon.dias_validez_cumple?.toString() || '30',
      usos_maximos: cupon.usos_maximos?.toString() || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCupon) {
      updateMutation.mutate({ id: editingCupon.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar este cupón?')) {
      deleteMutation.mutate(id);
    }
  };

  const openAsignar = (cupon: Cupon) => {
    setCuponAsignar(cupon);
    setSearchEntrenado('');
    setShowAsignarModal(true);
  };

  const formatDescuento = (cupon: Cupon) => {
    if (cupon.tipo_descuento === 'porcentaje' && cupon.valor_descuento) {
      return `${cupon.valor_descuento}% OFF`;
    }
    if (cupon.tipo_descuento === 'monto_fijo' && cupon.valor_descuento) {
      return `$${cupon.valor_descuento} OFF`;
    }
    return 'Especial';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const filteredEntrenados = entrenados?.filter((e) => {
    const search = searchEntrenado.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(search) ||
      e.apellido.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cupones de Descuento</h1>
          <p className="text-gray-600">Gestión de cupones para entrenados</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cupón
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Negocio
            </label>
            <select
              value={filtroNegocio}
              onChange={(e) => setFiltroNegocio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {negocios?.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={filtroCumple}
              onChange={(e) => setFiltroCumple(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Solo cumpleaños</option>
              <option value="false">Regulares</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de cupones */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">Cargando cupones...</p>
        </div>
      ) : !cupones || cupones.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <p className="text-gray-500">No hay cupones registrados</p>
          <button
            onClick={openNew}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Crear primer cupón
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cupones.map((cupon) => (
            <div
              key={cupon.id}
              className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${
                cupon.es_cumpleanos ? 'border-l-yellow-400' : 'border-l-blue-400'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {cupon.negocio?.logo ? (
                      <img
                        src={cupon.negocio.logo}
                        alt={cupon.negocio.nombre}
                        className="w-12 h-12 rounded-lg object-contain bg-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 font-bold">
                          {cupon.negocio?.nombre?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{cupon.titulo}</h3>
                      <p className="text-sm text-gray-500">{cupon.negocio?.nombre}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cupon.es_cumpleanos && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Cumpleaños
                      </span>
                    )}
                    <button
                      onClick={() => toggleActivoMutation.mutate({ id: cupon.id, activo: !cupon.activo })}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        cupon.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cupon.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                </div>

                {cupon.descripcion && (
                  <p className="text-sm text-gray-600 mt-3">{cupon.descripcion}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {formatDescuento(cupon)}
                  </span>
                  {cupon.codigo && (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono">
                      {cupon.codigo}
                    </span>
                  )}
                </div>

                {(cupon.fecha_inicio || cupon.fecha_fin) && (
                  <p className="text-xs text-gray-500 mt-3">
                    {cupon.fecha_inicio && `Desde: ${formatDate(cupon.fecha_inicio)}`}
                    {cupon.fecha_inicio && cupon.fecha_fin && ' - '}
                    {cupon.fecha_fin && `Hasta: ${formatDate(cupon.fecha_fin)}`}
                  </p>
                )}

                {cupon.es_cumpleanos && cupon.dias_validez_cumple && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Válido por {cupon.dias_validez_cumple} días después del cumpleaños
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAsignar(cupon)}
                      className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      Asignar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Asignar este cupón a todos los entrenados activos?')) {
                          asignarTodosMutation.mutate(cupon.id);
                        }
                      }}
                      className="px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Asignar a todos
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(cupon)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(cupon.id)}
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
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCupon ? 'Editar Cupón' : 'Nuevo Cupón'}
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
                  Negocio *
                </label>
                <select
                  value={formData.negocio_id}
                  onChange={(e) => setFormData({ ...formData, negocio_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!!editingCupon}
                >
                  <option value="">Seleccionar negocio</option>
                  {negocios?.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nombre}
                    </option>
                  ))}
                </select>
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
                  placeholder="ej: 20% en suplementos"
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
                  placeholder="Detalles del descuento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de descuento *
                  </label>
                  <select
                    value={formData.tipo_descuento}
                    onChange={(e) => setFormData({ ...formData, tipo_descuento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {Object.entries(tipoDescuentoLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    value={formData.valor_descuento}
                    onChange={(e) => setFormData({ ...formData, valor_descuento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={formData.tipo_descuento === 'porcentaje' ? '20' : '500'}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código (opcional)
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="DESCUENTO20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="es_cumpleanos"
                    checked={formData.es_cumpleanos}
                    onChange={(e) => setFormData({ ...formData, es_cumpleanos: e.target.checked })}
                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <label htmlFor="es_cumpleanos" className="text-sm font-medium text-yellow-800">
                    Cupón de cumpleaños (se asigna automáticamente)
                  </label>
                </div>
                {formData.es_cumpleanos && (
                  <div>
                    <label className="block text-sm font-medium text-yellow-800 mb-1">
                      Días de validez después del cumpleaños
                    </label>
                    <input
                      type="number"
                      value={formData.dias_validez_cumple}
                      onChange={(e) => setFormData({ ...formData, dias_validez_cumple: e.target.value })}
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="30"
                      min="1"
                      max="365"
                    />
                  </div>
                )}
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
                    : editingCupon
                    ? 'Actualizar'
                    : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal asignar */}
      {showAsignarModal && cuponAsignar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Asignar Cupón</h2>
                <p className="text-sm text-gray-500">{cuponAsignar.titulo}</p>
              </div>
              <button
                onClick={() => {
                  setShowAsignarModal(false);
                  setCuponAsignar(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                value={searchEntrenado}
                onChange={(e) => setSearchEntrenado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar entrenado..."
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredEntrenados?.map((entrenado) => (
                  <button
                    key={entrenado.id}
                    onClick={() => asignarMutation.mutate({ cuponId: cuponAsignar.id, entrenadoId: entrenado.id })}
                    disabled={asignarMutation.isPending}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
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
                    </div>
                  </button>
                ))}
                {filteredEntrenados?.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No se encontraron entrenados</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
