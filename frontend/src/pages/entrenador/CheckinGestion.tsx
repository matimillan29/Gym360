import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
    total_pagado: number;
    fecha_vencimiento: string;
    estado: 'al_dia' | 'pendiente' | 'parcial' | 'vencida' | 'sin_cuota';
    dias_restantes: number | null;
    clases_restantes: number | null;
  } | null;
}

interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
}

const estadoColors = {
  al_dia: 'bg-green-100 text-green-800 border-green-300',
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  parcial: 'bg-orange-100 text-orange-800 border-orange-300',
  vencida: 'bg-red-100 text-red-800 border-red-300',
  sin_cuota: 'bg-gray-100 text-gray-800 border-gray-300',
};

const estadoLabels = {
  al_dia: 'Al día',
  pendiente: 'Pendiente de pago',
  parcial: 'Pago parcial',
  vencida: 'Vencida',
  sin_cuota: 'Sin cuota',
};

export default function CheckinGestion() {
  const [busqueda, setBusqueda] = useState('');
  const [entrenado, setEntrenado] = useState<EntrenadoCheckin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

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
      const response = await api.post<{ message: string; warning?: string; data: { nombre: string; hora: string; clases_restantes: number | null } }>(`/checkin/${entrenadoId}/registrar`);
      return response.data;
    },
    onSuccess: (data) => {
      setSuccessMessage(`${data.data.nombre} - Ingreso registrado a las ${data.data.hora}`);
      setWarningMessage(data.warning || null);
      if (data.data.clases_restantes !== null && entrenado?.cuota) {
        setEntrenado({
          ...entrenado,
          cuota: {
            ...entrenado.cuota,
            clases_restantes: data.data.clases_restantes,
          },
        });
      }
    },
    onError: (err: AxiosError<ApiError>) => {
      setError(err.response?.data?.message || 'Error al registrar ingreso');
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
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const openStandaloneCheckin = () => {
    window.open('/checkin', 'checkin', 'width=500,height=800,menubar=no,toolbar=no,location=no');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Check-in de Entrenados</h1>
            <p className="text-emerald-100">Registra el ingreso de entrenados al gimnasio</p>
          </div>
          <button
            onClick={openStandaloneCheckin}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Abrir en ventana
          </button>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {/* Búsqueda */}
        {!entrenado && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleBuscar} className="space-y-4">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Buscar entrenado
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="DNI, nombre o usuario (ej: MaMi)"
                    className="w-full pl-14 pr-4 py-4 text-xl border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    autoFocus
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Ingresá al menos 3 caracteres para buscar
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-700 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busqueda.trim().length < 3 || buscarMutation.isPending}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {buscarMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Buscando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Buscar
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Resultado */}
        {entrenado && (
          <div className="space-y-4">
            {/* Success/Warning messages */}
            {successMessage && (
              <div className="p-4 rounded-xl bg-green-50 text-green-800 flex items-center gap-2 animate-pulse">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {warningMessage && (
              <div className="p-4 rounded-xl bg-yellow-50 text-yellow-800 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{warningMessage}</span>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-50 text-red-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Datos del entrenado */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Foto y nombre */}
              <div className="p-6 flex items-center gap-4 border-b border-gray-100">
                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {entrenado.foto ? (
                    <img src={entrenado.foto} alt={entrenado.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {entrenado.nombre} {entrenado.apellido}
                  </h2>
                  <p className="text-gray-500">DNI: {entrenado.dni}</p>
                  {entrenado.entrenador && (
                    <p className="text-sm text-gray-400">
                      Entrenador: {entrenado.entrenador.nombre} {entrenado.entrenador.apellido}
                    </p>
                  )}
                </div>
              </div>

              {/* Estado de cuota */}
              <div className="p-6">
                {entrenado.cuota ? (
                  <div className={`p-4 rounded-xl border-2 ${estadoColors[entrenado.cuota.estado]}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">{estadoLabels[entrenado.cuota.estado]}</span>
                      {entrenado.cuota.dias_restantes !== null && (
                        <span className="text-sm">
                          {entrenado.cuota.dias_restantes > 0
                            ? `${entrenado.cuota.dias_restantes} días restantes`
                            : entrenado.cuota.dias_restantes === 0
                            ? 'Vence hoy'
                            : `Venció hace ${Math.abs(entrenado.cuota.dias_restantes)} días`}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Plan</p>
                        <p className="font-medium">{entrenado.cuota.plan}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Vencimiento</p>
                        <p className="font-medium">{formatDate(entrenado.cuota.fecha_vencimiento)}</p>
                      </div>
                      {entrenado.cuota.clases_restantes !== null && (
                        <div className="col-span-2">
                          <p className="text-gray-600">Clases restantes</p>
                          <p className="font-medium text-lg">{entrenado.cuota.clases_restantes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-gray-100 text-gray-600 text-center">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>El entrenado no tiene cuota asignada</p>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="p-6 bg-gray-50 flex gap-4">
                <button
                  onClick={handleNuevaBusqueda}
                  className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Nueva búsqueda
                </button>
                <button
                  onClick={handleRegistrar}
                  disabled={registrarMutation.isPending || entrenado.estado !== 'activo'}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {registrarMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Registrar ingreso
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
