import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

type LoginTab = 'entrenador' | 'entrenado';

interface EntrenadorForm {
  email: string;
  password: string;
}

interface EntrenadoForm {
  email: string;
  password: string;
}

interface CalendarioHoy {
  fecha: string;
  es_especial: boolean;
  cerrado: boolean;
  hora_apertura: string | null;
  hora_cierre: string | null;
  horario: string;
  dia?: string;
  titulo?: string;
  descripcion?: string | null;
  tipo?: string;
  color?: string | null;
}

export default function LoginPage() {
  const { login, loginEntrenado, gymConfig } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<LoginTab>('entrenado');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [calendarioHoy, setCalendarioHoy] = useState<CalendarioHoy | null>(null);

  const entrenadorForm = useForm<EntrenadorForm>();
  const entrenadoForm = useForm<EntrenadoForm>();

  useEffect(() => {
    const fetchCalendario = async () => {
      try {
        const response = await api.get<{ data: CalendarioHoy }>('/calendario/hoy');
        setCalendarioHoy(response.data.data);
      } catch {
        // Ignorar si no hay calendario configurado
      }
    };
    fetchCalendario();
  }, []);

  const onSubmitEntrenador = async (data: EntrenadorForm) => {
    setError('');
    setIsLoading(true);

    try {
      await login(data.email, data.password);
      navigate('/entrenador');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      setError(error.response?.data?.message || Object.values(error.response?.data?.errors || {})[0]?.[0] || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitEntrenado = async (data: EntrenadoForm) => {
    setError('');
    setIsLoading(true);

    try {
      await loginEntrenado(data.email, data.password);
      navigate('/entrenado');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      setError(error.response?.data?.message || Object.values(error.response?.data?.errors || {})[0]?.[0] || 'Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  const colorPrincipal = gymConfig?.color_principal || '#16a34a';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          {/* Logo y nombre */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-4"
              style={{ backgroundColor: isDark ? colorPrincipal + '30' : colorPrincipal + '15' }}
            >
              {gymConfig?.logo ? (
                <img src={gymConfig.logo} alt={gymConfig.nombre} className="h-12 w-12 object-contain" />
              ) : (
                <svg className="h-10 w-10" style={{ color: colorPrincipal }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
                </svg>
              )}
            </div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {gymConfig?.nombre || 'Pwr360'}
            </h1>
          </div>

          {/* Estado del gym (calendario) */}
          {calendarioHoy && (
            <div
              className="mb-6 p-4 rounded-xl text-center"
              style={{
                backgroundColor: !calendarioHoy.cerrado
                  ? (isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgb(240, 253, 244)')
                  : (isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 242, 242)'),
                color: !calendarioHoy.cerrado
                  ? (isDark ? 'rgb(134, 239, 172)' : 'rgb(22, 101, 52)')
                  : (isDark ? 'rgb(252, 165, 165)' : 'rgb(153, 27, 27)')
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${!calendarioHoy.cerrado ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="font-semibold">
                  {!calendarioHoy.cerrado ? 'Abierto' : 'Cerrado'}
                </span>
              </div>
              {!calendarioHoy.cerrado && calendarioHoy.horario && (
                <p className="text-sm mt-1 opacity-80">
                  Hoy: {calendarioHoy.horario}
                </p>
              )}
              {calendarioHoy.es_especial && calendarioHoy.titulo && (
                <p className="text-sm mt-1 font-medium">{calendarioHoy.titulo}</p>
              )}
            </div>
          )}

          {/* Card de login */}
          <div className="rounded-2xl shadow-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
            {/* Tabs */}
            <div className="flex">
              <button
                onClick={() => { setActiveTab('entrenado'); setError(''); }}
                className={`flex-1 py-4 text-center font-medium transition-all ${
                  activeTab === 'entrenado'
                    ? 'text-white'
                    : ''
                }`}
                style={activeTab === 'entrenado'
                  ? { backgroundColor: colorPrincipal }
                  : { backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Entrenado
                </div>
              </button>
              <button
                onClick={() => { setActiveTab('entrenador'); setError(''); }}
                className={`flex-1 py-4 text-center font-medium transition-all ${
                  activeTab === 'entrenador'
                    ? 'bg-blue-600 text-white'
                    : ''
                }`}
                style={activeTab !== 'entrenador'
                  ? { backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }
                  : undefined}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Entrenador
                </div>
              </button>
            </div>

            {/* Form container */}
            <div className="p-6">
              {error && (
                <div
                  className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2"
                  style={{
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 242, 242)',
                    color: isDark ? 'rgb(252, 165, 165)' : 'rgb(185, 28, 28)'
                  }}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {activeTab === 'entrenado' ? (
                <form onSubmit={entrenadoForm.handleSubmit(onSubmitEntrenado)} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Email
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        {...entrenadoForm.register('email', {
                          required: 'El email es requerido',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido'
                          }
                        })}
                        type="email"
                        className="w-full pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-offset-0 transition-all"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          borderColor: 'transparent',
                          outlineColor: colorPrincipal,
                        }}
                        onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${colorPrincipal}`}
                        onBlur={(e) => e.target.style.boxShadow = 'none'}
                      />
                    </div>
                    {entrenadoForm.formState.errors.email && (
                      <p className="mt-1 text-sm text-red-600">{entrenadoForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Contraseña
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        {...entrenadoForm.register('password', {
                          required: 'La contraseña es requerida',
                        })}
                        type="password"
                        className="w-full pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-offset-0 transition-all"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          borderColor: 'transparent',
                          outlineColor: colorPrincipal,
                        }}
                        onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${colorPrincipal}`}
                        onBlur={(e) => e.target.style.boxShadow = 'none'}
                      />
                    </div>
                    {entrenadoForm.formState.errors.password && (
                      <p className="mt-1 text-sm text-red-600">{entrenadoForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    style={{ backgroundColor: colorPrincipal }}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Ingresando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Ingresar
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={entrenadorForm.handleSubmit(onSubmitEntrenador)} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Email
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <input
                        {...entrenadorForm.register('email', {
                          required: 'El email es requerido',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido'
                          }
                        })}
                        type="email"
                        className="w-full pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all"
                        style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'transparent' }}
                        placeholder="tu@email.com"
                      />
                    </div>
                    {entrenadorForm.formState.errors.email && (
                      <p className="mt-1 text-sm text-red-600">{entrenadorForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Contraseña
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        {...entrenadorForm.register('password', { required: 'La contraseña es requerida' })}
                        type="password"
                        className="w-full pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 transition-all"
                        style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'transparent' }}
                        placeholder="••••••••"
                      />
                    </div>
                    {entrenadorForm.formState.errors.password && (
                      <p className="mt-1 text-sm text-red-600">{entrenadorForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Ingresando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Ingresar
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Pwr360 - Sistema de gestión para gimnasios
          </p>
        </div>
      </div>
    </div>
  );
}
