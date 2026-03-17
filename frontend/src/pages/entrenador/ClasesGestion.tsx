import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Clase {
  id: number;
  nombre: string;
  descripcion?: string;
  duracion_minutos: number;
  capacidad_maxima: number;
  color: string;
  activa: boolean;
  requiere_reserva: boolean;
  sucursal_id?: number | null;
  sucursal?: { id: number; nombre: string };
  horarios_activos_count?: number;
}

interface Sucursal {
  id: number;
  nombre: string;
  activa: boolean;
}

interface HorarioClase {
  id: number;
  clase_id: number;
  instructor_id?: number;
  instructor?: { id: number; nombre: string; apellido: string };
  dia_semana: number | null;
  hora_inicio: string;
  hora_fin: string;
  fecha_especifica?: string | null;
  cancelada: boolean;
}

interface Entrenador {
  id: number;
  nombre: string;
  apellido: string;
}

interface Asistencia {
  id: number;
  fecha: string;
  estado: 'reservado' | 'presente' | 'ausente' | 'cancelado';
  entrenado: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
}

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const coloresPreset = [
  '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6366F1', '#14B8A6'
];

export default function ClasesGestion() {
  const queryClient = useQueryClient();
  const { gymConfig } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showHorariosModal, setShowHorariosModal] = useState(false);
  const [editingClase, setEditingClase] = useState<Clase | null>(null);
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    duracion_minutos: 60,
    capacidad_maxima: 20,
    color: '#8B5CF6',
    requiere_reserva: true,
    sucursal_id: null as number | null,
  });
  const [horarioForm, setHorarioForm] = useState({
    dia_semana: 1,
    hora_inicio: '09:00',
    hora_fin: '10:00',
    instructor_id: '',
  });
  const [showAsistenciasModal, setShowAsistenciasModal] = useState(false);
  const [selectedHorario, setSelectedHorario] = useState<HorarioClase | null>(null);
  const [asistenciasFecha, setAsistenciasFecha] = useState(new Date().toISOString().split('T')[0]);

  // Fetch clases
  const { data: clases = [], isLoading } = useQuery<Clase[]>({
    queryKey: ['clases'],
    queryFn: async () => {
      const response = await api.get('/clases');
      return response.data.data || [];
    },
  });

  // Fetch entrenadores para asignar instructor
  const { data: entrenadores = [] } = useQuery<Entrenador[]>({
    queryKey: ['entrenadores'],
    queryFn: async () => {
      const response = await api.get('/entrenadores');
      return response.data.data || [];
    },
  });

  // Fetch sucursales si multi_sucursal está activo
  const { data: sucursales = [] } = useQuery<Sucursal[]>({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const response = await api.get('/sucursales-activas');
      return response.data.data || response.data || [];
    },
    enabled: !!gymConfig?.multi_sucursal,
  });

  // Fetch horarios de una clase
  const { data: horarios = [] } = useQuery<HorarioClase[]>({
    queryKey: ['clase-horarios', selectedClase?.id],
    queryFn: async () => {
      const response = await api.get(`/clases/${selectedClase!.id}/horarios`);
      return response.data.data || [];
    },
    enabled: !!selectedClase,
  });

  // Fetch asistencias de un horario
  const { data: asistencias = [], isLoading: loadingAsistencias } = useQuery<Asistencia[]>({
    queryKey: ['horario-asistencias', selectedHorario?.id, asistenciasFecha],
    queryFn: async () => {
      const response = await api.get(`/horarios-clase/${selectedHorario!.id}/asistentes`, {
        params: { fecha: asistenciasFecha },
      });
      return response.data.data || [];
    },
    enabled: !!selectedHorario && showAsistenciasModal,
  });

  // Mutations
  const createClaseMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/clases', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clases'] });
      closeModal();
    },
  });

  const updateClaseMutation = useMutation({
    mutationFn: (data: typeof formData & { id: number }) =>
      api.put(`/clases/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clases'] });
      closeModal();
    },
  });

  const toggleActivaMutation = useMutation({
    mutationFn: (clase: Clase) =>
      api.put(`/clases/${clase.id}`, { activa: !clase.activa }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clases'] });
    },
  });

  const createHorarioMutation = useMutation({
    mutationFn: (data: typeof horarioForm) =>
      api.post(`/clases/${selectedClase!.id}/horarios`, {
        ...data,
        instructor_id: data.instructor_id || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clase-horarios', selectedClase?.id] });
      queryClient.invalidateQueries({ queryKey: ['clases'] });
      setHorarioForm({ dia_semana: 1, hora_inicio: '09:00', hora_fin: '10:00', instructor_id: '' });
    },
  });

  const deleteHorarioMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/horarios-clase/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clase-horarios', selectedClase?.id] });
      queryClient.invalidateQueries({ queryKey: ['clases'] });
    },
  });

  const updateAsistenciaMutation = useMutation({
    mutationFn: ({ asistenciaId, estado }: { asistenciaId: number; estado: string }) =>
      api.post(`/asistencias-clase/${asistenciaId}/checkin`, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horario-asistencias', selectedHorario?.id, asistenciasFecha] });
    },
  });

  const openAsistenciasModal = (horario: HorarioClase) => {
    setSelectedHorario(horario);
    setShowAsistenciasModal(true);
  };

  const openCreateModal = () => {
    setEditingClase(null);
    setFormData({
      nombre: '',
      descripcion: '',
      duracion_minutos: 60,
      capacidad_maxima: 20,
      color: '#8B5CF6',
      requiere_reserva: true,
      sucursal_id: sucursales.length > 0 ? sucursales[0].id : null,
    });
    setShowModal(true);
  };

  const openEditModal = (clase: Clase) => {
    setEditingClase(clase);
    setFormData({
      nombre: clase.nombre,
      descripcion: clase.descripcion || '',
      duracion_minutos: clase.duracion_minutos,
      capacidad_maxima: clase.capacidad_maxima,
      color: clase.color,
      requiere_reserva: clase.requiere_reserva,
      sucursal_id: clase.sucursal_id || null,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClase(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClase) {
      updateClaseMutation.mutate({ ...formData, id: editingClase.id });
    } else {
      createClaseMutation.mutate(formData);
    }
  };

  const openHorariosModal = (clase: Clase) => {
    setSelectedClase(clase);
    setShowHorariosModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando actividades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-purple-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Actividades</h1>
            <p className="text-purple-100">Gestiona los tipos de actividades y sus horarios</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Actividad
          </button>
        </div>
      </div>

      {/* Lista de clases */}
      {clases.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Sin actividades</h3>
          <p className="text-gray-500 mb-4">Creá tu primera actividad</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Crear primera actividad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clases.map((clase) => (
            <div
              key={clase.id}
              className={`bg-white rounded-xl shadow-sm overflow-hidden ${!clase.activa ? 'opacity-60' : ''}`}
            >
              <div className="h-2" style={{ backgroundColor: clase.color }} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{clase.nombre}</h3>
                    <p className="text-sm text-gray-500">
                      {clase.duracion_minutos} min • {clase.capacidad_maxima} personas
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      clase.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {clase.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {clase.descripcion && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{clase.descripcion}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <span>{clase.horarios_activos_count || 0} horarios</span>
                    {gymConfig?.multi_sucursal && clase.sucursal && (
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {clase.sucursal.nombre}
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    clase.requiere_reserva
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {clase.requiere_reserva ? 'Con reserva' : 'Libre'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openHorariosModal(clase)}
                    className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-sm font-medium"
                  >
                    Horarios
                  </button>
                  <button
                    onClick={() => openEditModal(clase)}
                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => toggleActivaMutation.mutate(clase)}
                    className={`p-2 rounded-lg ${
                      clase.activa
                        ? 'text-orange-500 hover:bg-orange-50'
                        : 'text-green-500 hover:bg-green-50'
                    }`}
                  >
                    {clase.activa ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar clase */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingClase ? 'Editar Actividad' : 'Nueva Actividad'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Funcional, Yoga, Spinning"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                {gymConfig?.multi_sucursal && sucursales.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sucursal <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.sucursal_id || ''}
                      onChange={(e) => setFormData({ ...formData, sucursal_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Seleccionar sucursal...</option>
                      {sucursales.map((suc) => (
                        <option key={suc.id} value={suc.id}>
                          {suc.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={2}
                    placeholder="Descripción breve de la actividad..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración (min)
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="180"
                      value={formData.duracion_minutos}
                      onChange={(e) => setFormData({ ...formData, duracion_minutos: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacidad máx.
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.capacidad_maxima}
                      onChange={(e) => setFormData({ ...formData, capacidad_maxima: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {coloresPreset.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Requiere reserva</p>
                    <p className="text-sm text-gray-500">
                      {formData.requiere_reserva
                        ? 'Los alumnos deben reservar lugar antes de asistir'
                        : 'Entrada libre sin necesidad de reservar'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, requiere_reserva: !formData.requiere_reserva })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      formData.requiere_reserva ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        formData.requiere_reserva ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createClaseMutation.isPending || updateClaseMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {editingClase ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal gestionar horarios */}
      {showHorariosModal && selectedClase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Horarios de {selectedClase.nombre}
                </h2>
                <p className="text-sm text-gray-500">
                  Define cuándo se dicta esta clase
                </p>
              </div>
              <button
                onClick={() => setShowHorariosModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {/* Formulario agregar horario */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Agregar horario</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Día</label>
                    <select
                      value={horarioForm.dia_semana}
                      onChange={(e) => setHorarioForm({ ...horarioForm, dia_semana: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      {diasSemana.map((dia, i) => (
                        <option key={i} value={i}>{dia}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Inicio</label>
                    <input
                      type="time"
                      value={horarioForm.hora_inicio}
                      onChange={(e) => setHorarioForm({ ...horarioForm, hora_inicio: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Fin</label>
                    <input
                      type="time"
                      value={horarioForm.hora_fin}
                      onChange={(e) => setHorarioForm({ ...horarioForm, hora_fin: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Instructor</label>
                    <select
                      value={horarioForm.instructor_id}
                      onChange={(e) => setHorarioForm({ ...horarioForm, instructor_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">Sin asignar</option>
                      {entrenadores.map((ent) => (
                        <option key={ent.id} value={ent.id}>
                          {ent.nombre} {ent.apellido}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => createHorarioMutation.mutate(horarioForm)}
                  disabled={createHorarioMutation.isPending}
                  className="mt-3 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                >
                  Agregar horario
                </button>
              </div>

              {/* Lista de horarios */}
              <h3 className="font-medium text-gray-900 mb-3">Horarios configurados</h3>
              {horarios.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay horarios configurados para esta clase
                </p>
              ) : (
                <div className="space-y-2">
                  {horarios.map((horario) => (
                    <div
                      key={horario.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        horario.cancelada ? 'bg-red-50 border-red-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900 w-28">
                          {horario.dia_semana !== null
                            ? diasSemana[horario.dia_semana]
                            : horario.fecha_especifica
                              ? new Date(horario.fecha_especifica + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
                              : 'Sin fecha'}
                        </span>
                        <span className="text-gray-600">
                          {horario.hora_inicio.slice(0, 5)} - {horario.hora_fin.slice(0, 5)}
                        </span>
                        {horario.fecha_especifica && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                            Fecha especial
                          </span>
                        )}
                        {horario.instructor && (
                          <span className="text-sm text-gray-500">
                            • {horario.instructor.nombre} {horario.instructor.apellido}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {selectedClase?.requiere_reserva && (
                          <button
                            onClick={() => openAsistenciasModal(horario)}
                            className="p-1 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded"
                            title="Ver inscriptos"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este horario?')) {
                              deleteHorarioMutation.mutate(horario.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal ver asistencias */}
      {showAsistenciasModal && selectedHorario && selectedClase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Inscriptos - {selectedClase.nombre}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedHorario.dia_semana !== null
                      ? diasSemana[selectedHorario.dia_semana]
                      : 'Fecha especial'}{' '}
                    {selectedHorario.hora_inicio.slice(0, 5)} - {selectedHorario.hora_fin.slice(0, 5)}
                  </p>
                </div>
                <button
                  onClick={() => setShowAsistenciasModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Selector de fecha */}
              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-1">Fecha</label>
                <input
                  type="date"
                  value={asistenciasFecha}
                  onChange={(e) => setAsistenciasFecha(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {loadingAsistencias ? (
                <p className="text-center text-gray-500 py-8">Cargando inscriptos...</p>
              ) : asistencias.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500">No hay inscriptos para esta fecha</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-4">
                    {asistencias.length} inscripto{asistencias.length !== 1 ? 's' : ''} de {selectedClase.capacidad_maxima} lugares
                  </p>
                  {asistencias.map((asistencia) => (
                    <div
                      key={asistencia.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
                          {asistencia.entrenado.nombre.charAt(0)}{asistencia.entrenado.apellido.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {asistencia.entrenado.nombre} {asistencia.entrenado.apellido}
                          </p>
                          <p className="text-sm text-gray-500">{asistencia.entrenado.email}</p>
                        </div>
                      </div>
                      <select
                        value={asistencia.estado}
                        onChange={(e) => updateAsistenciaMutation.mutate({
                          asistenciaId: asistencia.id,
                          estado: e.target.value,
                        })}
                        className={`px-2 py-1 rounded-lg text-sm border-0 ${
                          asistencia.estado === 'presente'
                            ? 'bg-green-100 text-green-700'
                            : asistencia.estado === 'ausente'
                            ? 'bg-red-100 text-red-700'
                            : asistencia.estado === 'cancelado'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        <option value="reservado">Reservado</option>
                        <option value="presente">Presente</option>
                        <option value="ausente">Ausente</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
