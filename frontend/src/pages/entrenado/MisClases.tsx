import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface Clase {
  id: number;
  nombre: string;
  descripcion?: string;
  duracion_minutos: number;
  capacidad_maxima: number;
  color: string;
  requiere_reserva: boolean;
}

interface Instructor {
  id: number;
  nombre: string;
  apellido: string;
}

interface ClaseDisponible {
  id: number;
  clase: Clase;
  instructor?: Instructor;
  hora_inicio: string;
  hora_fin: string;
  lugares_disponibles: number;
  ya_reservado: boolean;
  reserva_id?: number;
}

interface Reserva {
  id: number;
  fecha: string;
  estado: 'reservado' | 'presente' | 'ausente' | 'cancelado';
  horario_clase: {
    hora_inicio: string;
    hora_fin: string;
    clase: Clase;
    instructor?: Instructor;
  };
}

export default function MisClases() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'disponibles' | 'reservas'>('disponibles');

  // Fetch clases disponibles para el día seleccionado
  const { data: clasesDisponibles = [], isLoading: loadingDisponibles } = useQuery<ClaseDisponible[]>({
    queryKey: ['clases-disponibles', selectedDate],
    queryFn: async () => {
      const response = await api.get('/mi/clases/disponibles', { params: { fecha: selectedDate } });
      return response.data.data || [];
    },
  });

  // Fetch mis reservas
  const { data: misReservas = [], isLoading: loadingReservas } = useQuery<Reserva[]>({
    queryKey: ['mis-reservas'],
    queryFn: async () => {
      const response = await api.get('/mi/clases/reservas');
      return response.data.data || [];
    },
  });

  // Mutation para reservar
  const reservarMutation = useMutation({
    mutationFn: async (horarioId: number) => {
      return api.post(`/mi/clases/${horarioId}/reservar`, { fecha: selectedDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clases-disponibles'] });
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al reservar');
    },
  });

  // Mutation para cancelar reserva
  const cancelarMutation = useMutation({
    mutationFn: async (reservaId: number) => {
      return api.post(`/mi/clases/reservas/${reservaId}/cancelar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clases-disponibles'] });
      queryClient.invalidateQueries({ queryKey: ['mis-reservas'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al cancelar');
    },
  });

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-purple-600 rounded-2xl p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold mb-1">Actividades</h1>
        <p className="text-purple-100">Reservá tu lugar en las actividades del gimnasio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('disponibles')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'disponibles'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Actividades disponibles
        </button>
        <button
          onClick={() => setActiveTab('reservas')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'reservas'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Mis reservas
          {misReservas.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'reservas' ? 'bg-white/20' : 'bg-purple-100 text-purple-600'
            }`}>
              {misReservas.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'disponibles' && (
        <>
          {/* Selector de día */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {getNextDays().map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl text-center transition-colors ${
                    selectedDate === day
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <p className="text-xs uppercase">
                    {new Date(day + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' })}
                  </p>
                  <p className="text-lg font-bold">
                    {new Date(day + 'T12:00:00').getDate()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de clases */}
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 capitalize">
              {getDayName(selectedDate)}
            </h2>

            {loadingDisponibles ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <p className="text-gray-500">Cargando actividades...</p>
              </div>
            ) : clasesDisponibles.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No hay actividades programadas para este día</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clasesDisponibles.map((clase) => (
                  <div
                    key={clase.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden"
                  >
                    <div className="h-1" style={{ backgroundColor: clase.clase.color }} />
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-bold text-gray-900">
                              {clase.hora_inicio.slice(0, 5)}
                            </span>
                            <div>
                              <h3 className="font-semibold text-gray-900">{clase.clase.nombre}</h3>
                              <p className="text-sm text-gray-500">
                                {clase.clase.duracion_minutos} min
                                {clase.instructor && ` • ${clase.instructor.nombre} ${clase.instructor.apellido}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              clase.lugares_disponibles > 3
                                ? 'bg-green-100 text-green-700'
                                : clase.lugares_disponibles > 0
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {clase.lugares_disponibles > 0
                                ? `${clase.lugares_disponibles} lugares`
                                : 'Completo'}
                            </span>
                          </div>
                        </div>

                        <div>
                          {!clase.clase.requiere_reserva ? (
                            <span className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                              Entrada libre
                            </span>
                          ) : clase.ya_reservado ? (
                            <div className="text-center">
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-2 inline-block">
                                Reservado
                              </span>
                              <button
                                onClick={() => {
                                  if (confirm('¿Cancelar esta reserva?')) {
                                    cancelarMutation.mutate(clase.reserva_id!);
                                  }
                                }}
                                disabled={cancelarMutation.isPending}
                                className="block w-full text-sm text-red-600 hover:text-red-700"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => reservarMutation.mutate(clase.id)}
                              disabled={clase.lugares_disponibles === 0 || reservarMutation.isPending}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {reservarMutation.isPending ? 'Reservando...' : 'Reservar'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'reservas' && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Próximas reservas</h2>

          {loadingReservas ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-500">Cargando reservas...</p>
            </div>
          ) : misReservas.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 mb-2">No tenés reservas pendientes</p>
              <button
                onClick={() => setActiveTab('disponibles')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Ver actividades disponibles
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {misReservas.map((reserva) => (
                <div
                  key={reserva.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="h-1" style={{ backgroundColor: reserva.horario_clase.clase.color }} />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {new Date(reserva.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-900">
                            {reserva.horario_clase.hora_inicio.slice(0, 5)}
                          </span>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {reserva.horario_clase.clase.nombre}
                            </h3>
                            {reserva.horario_clase.instructor && (
                              <p className="text-sm text-gray-500">
                                {reserva.horario_clase.instructor.nombre} {reserva.horario_clase.instructor.apellido}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          reserva.estado === 'reservado'
                            ? 'bg-blue-100 text-blue-700'
                            : reserva.estado === 'presente'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {reserva.estado === 'reservado' ? 'Confirmado' : reserva.estado}
                        </span>
                        {reserva.estado === 'reservado' && (
                          <button
                            onClick={() => {
                              if (confirm('¿Cancelar esta reserva?')) {
                                cancelarMutation.mutate(reserva.id);
                              }
                            }}
                            disabled={cancelarMutation.isPending}
                            className="block w-full mt-2 text-sm text-red-600 hover:text-red-700"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
