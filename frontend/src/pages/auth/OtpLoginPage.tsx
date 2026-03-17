import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type Step = 'email' | 'code';

interface EmailForm {
  email: string;
}

interface CodeForm {
  code: string;
}

export default function OtpLoginPage() {
  const { requestOtp, verifyOtp, gymConfig } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const emailForm = useForm<EmailForm>();
  const codeForm = useForm<CodeForm>();

  useEffect(() => {
    if (step === 'code' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  const onSubmitEmail = async (data: EmailForm) => {
    setError('');
    setIsLoading(true);

    try {
      await requestOtp(data.email);
      setEmail(data.email);
      setStep('code');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al enviar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.slice(0, 6).split('');
      const newCodeDigits = [...codeDigits];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCodeDigits[index + i] = digit;
        }
      });
      setCodeDigits(newCodeDigits);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();

      if (newCodeDigits.every(d => d !== '')) {
        handleVerifyCode(newCodeDigits.join(''));
      }
    } else {
      const newCodeDigits = [...codeDigits];
      newCodeDigits[index] = value;
      setCodeDigits(newCodeDigits);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newCodeDigits.every(d => d !== '')) {
        handleVerifyCode(newCodeDigits.join(''));
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (code: string) => {
    setError('');
    setIsLoading(true);

    try {
      await verifyOtp(email, code);
      navigate('/entrenado');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Código inválido o expirado');
      setCodeDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitCode = async (data: CodeForm) => {
    await handleVerifyCode(data.code || codeDigits.join(''));
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await requestOtp(email);
      setSuccess('Código reenviado correctamente');
      setCodeDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al reenviar el código');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg mb-4">
            {gymConfig?.logo ? (
              <img src={gymConfig.logo} alt={gymConfig.nombre} className="h-12 w-12 object-contain" />
            ) : (
              <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {gymConfig?.nombre || 'Pwr360'}
          </h1>
          <p className="text-gray-500 mt-1">Acceso para entrenados</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border p-8">
          {step === 'email' ? (
            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-5">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-3">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Ingresá tu email</h2>
                <p className="text-sm text-gray-500 mt-1">Te enviaremos un código de acceso de 6 dígitos</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    {...emailForm.register('email', {
                      required: 'El email es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                    type="email"
                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  'Enviando...'
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Enviar código
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={codeForm.handleSubmit(onSubmitCode)} className="space-y-5">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError('');
                  setSuccess('');
                  setCodeDigits(['', '', '', '', '', '']);
                }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Cambiar email
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-3">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Ingresá el código</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enviamos un código de 6 dígitos a
                </p>
                <p className="text-sm font-medium text-green-600">{email}</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {success}
                </div>
              )}

              {/* Code input boxes */}
              <div className="flex justify-center gap-2">
                {codeDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    disabled={isLoading}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || codeDigits.some(d => !d)}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  'Verificando...'
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verificar código
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                >
                  ¿No recibiste el código? Reenviar
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-500">
              ¿Sos entrenador?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Ingresá con contraseña
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          El código expira en 10 minutos
        </p>
      </div>
    </div>
  );
}
