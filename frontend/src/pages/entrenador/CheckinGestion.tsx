import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { AxiosError } from 'axios';

interface EntrenadoCheckin {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  foto: string | null;
  email: string;
  telefono: string;
  estado: string;
  entrenador: {
    nombre: string;
    apellido: string;
  } | null;
  cuota: {
    id: number;
    plan: string;
    monto: number;
    monto_pagado: number;
    fecha_vencimiento: string;
    estado: 'al_dia' | 'pendiente' | 'parcial' | 'vencida' | 'sin_cuota';
    dias_restantes: number | null;
    clases_restantes: number | null;
  } | null;
}

interface IngresoHoy {
  id: number;
  entrenado: {
    id: number;
    nombre: string;
    apellido: string;
    foto: string | null;
    dni: string;
  } | null;
  hora_entrada: string;
  hora_salida: string | null;
  duracion_minutos: number | null;
  activo: boolean;
}

interface ApiError {
  message?: string;
}

const estadoColors: Record<string, string> = {
  al_dia: 'bg-green-100 text-green-800 border-green-300',
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  parcial: 'bg-orange-100 text-orange-800 border-orange-300',
  vencida: 'bg-red-100 text-red-800 border-red-300',
  sin_cuota: 'bg-gray-100 text-gray-800 border-gray-300',
};

const estadoLabels: Record<string, string> = {
  al_dia: 'Al día',
  pendiente: 'Pendiente de pago',
  parcial: 'Pago parcial',
  vencida: 'Vencida',
  sin_cuota: 'Sin cuota',
};

export default function CheckinGestion() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [entrenado, setEntrenado] = useState<EntrenadoCheckin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Fetch today's ingresos
  const { data: ingresosHoy = [] } = useQuery<IngresoHoy[]>({
    queryKey: ['ingresos-hoy'],
    queryFn: async () => {
      const response = await api.get('/checkin/hoy');
      return response.data.data || [];
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const activos = ingresosHoy.filter(i => i.activo);

  // Buscar entrenado
  const buscarMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await api.post<{ data: EntrenadoCheckin }>('/checkin/buscar', { busqueda: query });
      return response.data.data;
    },
    onSuccess: (data) => {
      setEntrenado(data);
      setError(null);
      setSuccessMessage(null);
      setWarningMessage(null);
    },
    onError: (err: AxiosError<ApiError>) => {
      setEntrenado(null);
      setError(err.response?.data?.message || 'Error al buscar');
    },
  });

  // Registrar ingreso
  const registrarMutation = useMutation({
    mutationFn: async (entrenadoId: number) => {
      const response = await api.post(`/checkin/${entrenadoId}/registrar`);
      return response.data;
    },
    onSuccess: (data) => {
      setSuccessMessage(`${data.data.nombre} - Ingreso registrado a las ${data.data.hora}`);
      setWarningMessage(data.warning || null);
      setError(null);
      if (data.data.clases_restantes !== null && entrenado?.cuota) {
        setEntrenado({
          ...entrenado,
          cuota: { ...entrenado.cuota, clases_restantes: data.data.clases_restantes },
        });
      }
      queryClient.invalidateQueries({ queryKey: ['ingresos-hoy'] });
    },
    onError: (err: AxiosError<ApiError>) => {
      setError(err.response?.data?.message || 'Error al registrar ingreso');
      setSuccessMessage(null);
    },
  });

  // Registrar salida
  const salidaMutation = useMutation({
    mutationFn: async (entrenadoId: number) => {
      const response = await api.post(`/checkin/${entrenadoId}/salida`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingresos-hoy'] });
    },
  });

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (busqueda.trim().length >= 3) {
      buscarMutation.mutate(busqueda.trim());
    }
  };

  const handleRegistrar = () => {
    if (entrenado) {
      registrarMutation.mutate(entrenado.id);
    }
  };

  const handleNuevaBusqueda = () => {
    setBusqueda('');
    setEntrenado(null);
    setError(null);
    setSuccessMessage(null);
    setWarningMessage(null);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const openStandaloneCheckin = () => {
    window.open('/checkin', 'checkin', 'width=500,height=800,menubar=no,toolbar=no,location=no');
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Check-in de Entrenados</h1>
            <p className="text-emerald-100">Registra ingresos y egresos del gimnasio</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/20 rounded-lg text-sm">
              <span className="text-emerald-100">En el gym:</span>
              <span className="font-bold ml-2">{activos.length}</span>
            </div>
            <button
              onClick={openStandaloneCheckin}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Kiosco
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Search & Check-in */}
        <div>
          {!entrenado ? (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Registrar ingreso</h2>
              <form onSubmit={handleBuscar} className="space-y-4">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="DNI, nombre o apellido..."
                    className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>
                {error && !entrenado && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
                )}
                <button
                  type="submit"
                  disabled={busqueda.trim().length < 3 || buscarMutation.isPending}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {buscarMutation.isPending ? 'Buscando...' : 'Buscar'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {successMessage && (
                <div className="p-4 rounded-xl bg-green-50 text-green-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}
              {warningMessage && (
                <div className="p-3 rounded-xl bg-yellow-50 text-yellow-800 text-sm">{warningMessage}</div>
              )}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
              )}

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 flex items-center gap-4 border-b">
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {entrenado.foto ? (
                      <img src={entrenado.foto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                        {entrenado.nombre[0]}{entrenado.apellido[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{entrenado.nombre} {entrenado.apellido}</h2>
                    <p className="text-gray-500 text-sm">DNI: {entrenado.dni}</p>
                  </div>
                </div>

                {entrenado.cuota && (
                  <div className="p-4">
                    <div className={`p-3 rounded-lg border ${estadoColors[entrenado.cuota.estado]}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{estadoLabels[entrenado.cuota.estado]}</span>
                        {entrenado.cuota.dias_restantes !== null && (
                          <span className="text-sm">
                            {entrenado.cuota.dias_restantes > 0
                              ? `${entrenado.cuota.dias_restantes} días`
                              : entrenado.cuota.dias_restantes === 0 ? 'Vence hoy'
                              : `Venció hace ${Math.abs(entrenado.cuota.dias_restantes)} días`}
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-1">{entrenado.cuota.plan} — Vence: {formatDate(entrenado.cuota.fecha_vencimiento)}</p>
                      {entrenado.cuota.clases_restantes !== null && (
                        <p className="text-sm font-medium mt-1">Accesos restantes: {entrenado.cuota.clases_restantes}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gray-50 flex gap-3">
                  <button onClick={handleNuevaBusqueda} className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors">
                    Nueva búsqueda
                  </button>
                  <button
                    onClick={handleRegistrar}
                    disabled={registrarMutation.isPending || entrenado.estado !== 'activo'}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {registrarMutation.isPending ? 'Registrando...' : 'Registrar ingreso'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Today's ingresos */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Hoy en el gimnasio</h2>
            <span className="text-sm text-gray-500">{ingresosHoy.length} ingresos</span>
          </div>

          {ingresosHoy.length > 0 ? (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {ingresosHoy.map((ingreso) => (
                <div key={ingreso.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${ingreso.activo ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-xs">
                      {ingreso.entrenado?.nombre[0]}{ingreso.entrenado?.apellido[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {ingreso.entrenado?.nombre} {ingreso.entrenado?.apellido}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ingreso.hora_entrada}
                        {ingreso.hora_salida && ` — ${ingreso.hora_salida}`}
                        {ingreso.duracion_minutos !== null && ` (${ingreso.duracion_minutos} min)`}
                      </p>
                    </div>
                  </div>
                  {ingreso.activo && ingreso.entrenado && (
                    <button
                      onClick={() => salidaMutation.mutate(ingreso.entrenado!.id)}
                      disabled={salidaMutation.isPending}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      Salida
                    </button>
                  )}
                  {!ingreso.activo && (
                    <span className="text-xs text-gray-400">Salió</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>No hay ingresos registrados hoy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
