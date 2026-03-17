import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface ClaseSlot {
  id: number;
  clase_id: number;
  clase_nombre: string;
  color: string;
  hora_inicio: string;
  hora_fin: string;
  instructor: string | null;
  capacidad_maxima: number;
  lugares_disponibles: number;
  fecha: string;
}

interface DiaSemana {
  fecha: string;
  dia_nombre: string;
  clases: ClaseSlot[];
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
    foto?: string;
  };
}

const DIAS_SEMANA_CORTO = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatWeekRange(fechaBase: string): string {
  const inicio = new Date(fechaBase + 'T12:00:00');
  const fin = new Date(fechaBase + 'T12:00:00');
  fin.setDate(fin.getDate() + 6);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const dInicio = inicio.getDate();
  const dFin = fin.getDate();
  const mesInicio = meses[inicio.getMonth()];
  const mesFin = meses[fin.getMonth()];

  if (mesInicio === mesFin) {
    return `Semana del ${dInicio} al ${dFin} de ${mesInicio}`;
  }
  return `Semana del ${dInicio} de ${mesInicio} al ${dFin} de ${mesFin}`;
}

function isToday(fechaStr: string): boolean {
  return fechaStr === new Date().toISOString().split('T')[0];
}

export default function CalendarioClases() {
  const queryClient = useQueryClient();
  const [fechaBase, setFechaBase] = useState(() => getMonday(new Date().toISOString().split('T')[0]));
  const [selectedSlot, setSelectedSlot] = useState<{
    horarioId: number;
    fecha: string;
    clase: ClaseSlot;
  } | null>(null);

  // Fetch week schedule
  const { data: semana, isLoading } = useQuery<DiaSemana[]>({
    queryKey: ['calendario-clases', fechaBase],
    queryFn: async () => {
      const response = await api.get('/clases-calendario/semana', {
        params: { fecha: fechaBase },
      });
      return response.data.data || [];
    },
  });

  // Fetch attendees for selected slot
  const { data: asistentes, isLoading: loadingAsistentes } = useQuery<Asistencia[]>({
    queryKey: ['asistentes-calendario', selectedSlot?.horarioId, selectedSlot?.fecha],
    queryFn: async () => {
      if (!selectedSlot) return [];
      const response = await api.get(`/horarios-clase/${selectedSlot.horarioId}/asistentes`, {
        params: { fecha: selectedSlot.fecha },
      });
      return response.data.data || [];
    },
    enabled: !!selectedSlot,
  });

  // Mutation to change attendance status
  const checkinMutation = useMutation({
    mutationFn: ({ asistenciaId, estado }: { asistenciaId: number; estado: string }) =>
      api.post(`/asistencias-clase/${asistenciaId}/checkin`, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['asistentes-calendario', selectedSlot?.horarioId, selectedSlot?.fecha],
      });
      queryClient.invalidateQueries({ queryKey: ['calendario-clases', fechaBase] });
    },
  });

  // Week navigation
  const navigateWeek = (direction: number) => {
    const d = new Date(fechaBase + 'T12:00:00');
    d.setDate(d.getDate() + 7 * direction);
    setFechaBase(d.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setFechaBase(getMonday(new Date().toISOString().split('T')[0]));
  };

  // Collect all unique time slots across the week for the grid rows
  const timeSlots = useMemo(() => {
    if (!semana) return [];
    const times = new Set<string>();
    semana.forEach((dia) => {
      dia.clases.forEach((c) => {
        times.add(c.hora_inicio.slice(0, 5));
      });
    });
    return Array.from(times).sort();
  }, [semana]);

  // Group classes by day and time for the grid
  const gridData = useMemo(() => {
    if (!semana) return {};
    const map: Record<string, Record<string, ClaseSlot[]>> = {};
    semana.forEach((dia, dayIndex) => {
      map[dayIndex] = {};
      dia.clases.forEach((c) => {
        const time = c.hora_inicio.slice(0, 5);
        if (!map[dayIndex][time]) {
          map[dayIndex][time] = [];
        }
        map[dayIndex][time].push(c);
      });
    });
    return map;
  }, [semana]);

  const formatDayHeader = (dia: DiaSemana, index: number) => {
    const fecha = new Date(dia.fecha + 'T12:00:00');
    const dayNum = fecha.getDate();
    return { short: DIAS_SEMANA_CORTO[index], num: dayNum, isToday: isToday(dia.fecha) };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text-muted)' }}>Cargando calendario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="rounded-2xl p-6 text-white shadow-sm bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Calendario de Clases</h1>
            <p className="text-indigo-100 text-sm sm:text-base">
              Vista semanal de actividades y reservas
            </p>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors font-medium text-sm backdrop-blur-sm"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
        <button
          onClick={() => navigateWeek(-1)}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
          {formatWeekRange(fechaBase)}
        </h2>
        <button
          onClick={() => navigateWeek(1)}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Desktop: Weekly grid */}
      <div className="hidden lg:block rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        {/* Day headers */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="p-3" style={{ backgroundColor: 'var(--bg-hover)' }} />
          {semana?.map((dia, index) => {
            const { short, num, isToday: today } = formatDayHeader(dia, index);
            return (
              <div
                key={dia.fecha}
                className="p-3 text-center border-l"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: today ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-hover)',
                }}
              >
                <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>
                  {short}
                </p>
                <p
                  className={`text-lg font-bold mt-0.5 ${
                    today ? 'text-indigo-600 dark:text-indigo-400' : ''
                  }`}
                  style={!today ? { color: 'var(--text-primary)' } : undefined}
                >
                  {num}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time rows */}
        {timeSlots.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              No hay actividades programadas esta semana
            </p>
          </div>
        ) : (
          timeSlots.map((time) => (
            <div
              key={time}
              className="grid grid-cols-[80px_repeat(7,1fr)] border-b last:border-b-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              {/* Time label */}
              <div
                className="p-3 flex items-start justify-center"
                style={{ backgroundColor: 'var(--bg-hover)' }}
              >
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {time}
                </span>
              </div>

              {/* Day cells */}
              {semana?.map((dia, dayIndex) => {
                const clases = gridData[dayIndex]?.[time] || [];
                const today = isToday(dia.fecha);
                return (
                  <div
                    key={dia.fecha}
                    className="p-1.5 border-l min-h-[80px]"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: today ? 'rgba(99, 102, 241, 0.02)' : undefined,
                    }}
                  >
                    <div className="space-y-1">
                      {clases.map((clase) => {
                        const reservados = clase.capacidad_maxima - clase.lugares_disponibles;
                        const isFull = clase.lugares_disponibles <= 0;
                        return (
                          <div
                            key={`${clase.id}-${clase.fecha}`}
                            onClick={() =>
                              setSelectedSlot({
                                horarioId: clase.id,
                                fecha: clase.fecha,
                                clase,
                              })
                            }
                            className="p-2 rounded-lg cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
                            style={{
                              backgroundColor: clase.color + '18',
                              borderLeft: `3px solid ${clase.color}`,
                            }}
                          >
                            <p
                              className="font-medium text-sm truncate"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {clase.clase_nombre}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {clase.hora_inicio.slice(0, 5)} - {clase.hora_fin.slice(0, 5)}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              <span
                                className={`text-xs font-medium ${
                                  isFull
                                    ? 'text-red-500'
                                    : ''
                                }`}
                                style={!isFull ? { color: 'var(--text-muted)' } : undefined}
                              >
                                {reservados}/{clase.capacidad_maxima}
                              </span>
                            </div>
                            {clase.instructor && (
                              <p
                                className="text-xs truncate mt-0.5"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {clase.instructor}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Mobile: Vertical list by day */}
      <div className="lg:hidden space-y-4">
        {semana?.map((dia, index) => {
          const { short, num, isToday: today } = formatDayHeader(dia, index);
          if (dia.clases.length === 0) return null;
          return (
            <div
              key={dia.fecha}
              className="rounded-xl shadow-sm overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              {/* Day header */}
              <div
                className="px-4 py-3 border-b flex items-center gap-3"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: today ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-hover)',
                }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    today
                      ? 'bg-indigo-600 text-white'
                      : ''
                  }`}
                  style={
                    !today
                      ? { backgroundColor: 'var(--bg-active)', color: 'var(--text-primary)' }
                      : undefined
                  }
                >
                  {num}
                </div>
                <div>
                  <p
                    className={`font-semibold text-sm capitalize ${
                      today ? 'text-indigo-600 dark:text-indigo-400' : ''
                    }`}
                    style={!today ? { color: 'var(--text-primary)' } : undefined}
                  >
                    {dia.dia_nombre}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {short} {num}
                  </p>
                </div>
                {today && (
                  <span className="ml-auto px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                    Hoy
                  </span>
                )}
              </div>

              {/* Classes for this day */}
              <div className="p-3 space-y-2">
                {dia.clases
                  .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                  .map((clase) => {
                    const reservados = clase.capacidad_maxima - clase.lugares_disponibles;
                    const isFull = clase.lugares_disponibles <= 0;
                    return (
                      <div
                        key={`${clase.id}-${clase.fecha}`}
                        onClick={() =>
                          setSelectedSlot({
                            horarioId: clase.id,
                            fecha: clase.fecha,
                            clase,
                          })
                        }
                        className="p-3 rounded-lg cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all flex items-center gap-3"
                        style={{
                          backgroundColor: clase.color + '12',
                          borderLeft: `4px solid ${clase.color}`,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold text-sm truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {clase.clase_nombre}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {clase.hora_inicio.slice(0, 5)} - {clase.hora_fin.slice(0, 5)}
                              </span>
                            </div>
                            {clase.instructor && (
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {clase.instructor}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span
                            className={`text-xs font-bold ${
                              isFull ? 'text-red-500' : ''
                            }`}
                            style={!isFull ? { color: 'var(--text-secondary)' } : undefined}
                          >
                            {reservados}/{clase.capacidad_maxima}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}

        {/* Empty state for mobile */}
        {semana && semana.every((dia) => dia.clases.length === 0) && (
          <div
            className="rounded-xl shadow-sm p-12 text-center"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-muted)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              No hay actividades programadas esta semana
            </p>
          </div>
        )}
      </div>

      {/* Attendee Modal */}
      {selectedSlot && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSlot(null);
          }}
        >
          <div
            className="rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            {/* Modal header */}
            <div
              className="p-5 border-b"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: selectedSlot.clase.color + '10',
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3
                    className="font-bold text-lg"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {selectedSlot.clase.clase_nombre}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {new Date(selectedSlot.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {selectedSlot.clase.hora_inicio.slice(0, 5)} -{' '}
                      {selectedSlot.clase.hora_fin.slice(0, 5)}
                    </span>
                  </div>
                  {selectedSlot.clase.instructor && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      Instructor: {selectedSlot.clase.instructor}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Capacity bar */}
              {(() => {
                const reservados =
                  selectedSlot.clase.capacidad_maxima - selectedSlot.clase.lugares_disponibles;
                const porcentaje = Math.round(
                  (reservados / selectedSlot.clase.capacidad_maxima) * 100,
                );
                return (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {reservados} de {selectedSlot.clase.capacidad_maxima} lugares ocupados
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {porcentaje}%
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--border-color)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${porcentaje}%`,
                          backgroundColor: selectedSlot.clase.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Attendee list */}
            <div className="overflow-y-auto flex-1 p-4">
              {loadingAsistentes ? (
                <div className="flex items-center justify-center py-12">
                  <p style={{ color: 'var(--text-muted)' }}>Cargando inscriptos...</p>
                </div>
              ) : !asistentes || asistentes.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-14 h-14 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                    No hay reservas para esta clase
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Las reservas de los entrenados apareceran aca
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                    {asistentes.length} inscripto{asistentes.length !== 1 ? 's' : ''}
                  </p>
                  {asistentes.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--bg-hover)' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            backgroundColor: selectedSlot.clase.color + '25',
                            color: selectedSlot.clase.color,
                          }}
                        >
                          {a.entrenado?.nombre?.[0]}
                          {a.entrenado?.apellido?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-medium text-sm truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {a.entrenado?.nombre} {a.entrenado?.apellido}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {a.entrenado?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {/* Status badge */}
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full mr-1 ${
                            a.estado === 'presente'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                              : a.estado === 'ausente'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                          }`}
                        >
                          {a.estado === 'presente'
                            ? 'Presente'
                            : a.estado === 'ausente'
                              ? 'Ausente'
                              : 'Reservado'}
                        </span>

                        {/* Action buttons */}
                        <button
                          onClick={() =>
                            checkinMutation.mutate({
                              asistenciaId: a.id,
                              estado: 'presente',
                            })
                          }
                          disabled={checkinMutation.isPending}
                          className={`p-1.5 rounded-lg transition-colors ${
                            a.estado === 'presente'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                              : 'text-gray-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400'
                          }`}
                          title="Marcar presente"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() =>
                            checkinMutation.mutate({
                              asistenciaId: a.id,
                              estado: 'ausente',
                            })
                          }
                          disabled={checkinMutation.isPending}
                          className={`p-1.5 rounded-lg transition-colors ${
                            a.estado === 'ausente'
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                              : 'text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                          }`}
                          title="Marcar ausente"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
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
    </div>
  );
}
