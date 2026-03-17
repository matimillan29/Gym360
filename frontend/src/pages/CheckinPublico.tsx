import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import type { AxiosError } from 'axios';

interface EntrenadoCheckin {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  foto: string | null;
  estado: string;
  cuota: {
    id: number;
    plan: string;
    fecha_vencimiento: string;
    estado: 'al_dia' | 'pendiente' | 'parcial' | 'vencida' | 'sin_cuota';
    dias_restantes: number | null;
    clases_restantes: number | null;
  } | null;
}

interface ApiError {
  message?: string;
}

const estadoColors = {
  al_dia: 'bg-green-500',
  pendiente: 'bg-yellow-500',
  parcial: 'bg-orange-500',
  vencida: 'bg-red-500',
  sin_cuota: 'bg-gray-500',
};

const estadoLabels = {
  al_dia: 'AL DIA',
  pendiente: 'PENDIENTE',
  parcial: 'PARCIAL',
  vencida: 'VENCIDA',
  sin_cuota: 'SIN CUOTA',
};

export default function CheckinPublico() {
  const [dni, setDni] = useState('');
  const [entrenado, setEntrenado] = useState<EntrenadoCheckin | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-reset after 5 seconds when showing success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        handleReset();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dni.length < 3) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setWarning(null);

    try {
      const response = await api.post<{ data: EntrenadoCheckin }>('/checkin-publico/buscar', { dni });
      setEntrenado(response.data.data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.message || 'DNI no encontrado');
      setEntrenado(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!entrenado) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<{ message: string; warning?: string; data: { nombre: string; hora: string } }>(
        `/checkin-publico/${entrenado.id}/registrar`
      );
      setSuccess(`${response.data.data.nombre} - ${response.data.data.hora}`);
      setWarning(response.data.warning || null);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.message || 'Error al registrar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDni('');
    setEntrenado(null);
    setError(null);
    setSuccess(null);
    setWarning(null);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-teal-800 flex flex-col">
      {/* Header */}
      <div className="p-4 text-center">
        <h1 className="text-3xl font-bold text-white">CHECK-IN</h1>
        <p className="text-emerald-200 text-sm">Ingresa tu DNI para registrar tu entrada</p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Success state */}
          {success && (
            <div className="text-center animate-pulse">
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 ${
                warning ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">INGRESO OK</h2>
              <p className="text-2xl text-emerald-100">{success}</p>
              {warning && (
                <p className="mt-4 text-yellow-300 text-lg">{warning}</p>
              )}
              <button
                onClick={handleReset}
                className="mt-8 px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors"
              >
                Nueva consulta
              </button>
            </div>
          )}

          {/* Search/Result state */}
          {!success && (
            <>
              {/* DNI Input */}
              {!entrenado && (
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={dni}
                      onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ingresa tu DNI"
                      className="w-full text-center text-4xl py-6 px-4 rounded-2xl bg-white/10 text-white placeholder-white/50 border-2 border-white/30 focus:border-white focus:outline-none"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/30 text-red-100 text-center text-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={dni.length < 3 || isLoading}
                    className="w-full py-5 bg-white text-emerald-700 text-2xl font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-50 transition-colors"
                  >
                    {isLoading ? 'Buscando...' : 'BUSCAR'}
                  </button>
                </form>
              )}

              {/* Entrenado Found */}
              {entrenado && (
                <div className="space-y-4">
                  {/* Photo and name */}
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto rounded-full bg-white/20 overflow-hidden mb-4">
                      {entrenado.foto ? (
                        <img src={entrenado.foto} alt={entrenado.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                          {entrenado.nombre[0]}{entrenado.apellido[0]}
                        </div>
                      )}
                    </div>
                    <h2 className="text-3xl font-bold text-white">
                      {entrenado.nombre} {entrenado.apellido}
                    </h2>
                    <p className="text-emerald-200">DNI: {entrenado.dni}</p>
                  </div>

                  {/* Cuota status */}
                  {entrenado.cuota && (
                    <div className={`p-4 rounded-2xl ${estadoColors[entrenado.cuota.estado]} text-white text-center`}>
                      <p className="text-2xl font-bold">{estadoLabels[entrenado.cuota.estado]}</p>
                      {entrenado.cuota.dias_restantes !== null && entrenado.cuota.dias_restantes >= 0 && (
                        <p className="text-lg opacity-90">
                          {entrenado.cuota.dias_restantes} días restantes
                        </p>
                      )}
                      {entrenado.cuota.clases_restantes !== null && (
                        <p className="text-lg opacity-90">
                          {entrenado.cuota.clases_restantes} actividades restantes
                        </p>
                      )}
                    </div>
                  )}

                  {!entrenado.cuota && (
                    <div className="p-4 rounded-2xl bg-gray-500 text-white text-center">
                      <p className="text-2xl font-bold">SIN CUOTA</p>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/30 text-red-100 text-center text-lg">
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-4 bg-white/20 text-white text-xl font-medium rounded-2xl hover:bg-white/30 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCheckin}
                      disabled={isLoading || entrenado.estado !== 'activo'}
                      className="flex-1 py-4 bg-white text-emerald-700 text-xl font-bold rounded-2xl disabled:opacity-50 hover:bg-emerald-50 transition-colors"
                    >
                      {isLoading ? 'Registrando...' : 'REGISTRAR'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer with time */}
      <div className="p-4 text-center text-emerald-200">
        <p className="text-4xl font-mono">
          {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
        <p className="text-sm opacity-75">
          {currentTime.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
    </div>
  );
}
