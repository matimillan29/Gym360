import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Upload, Check } from 'lucide-react';
import api from '../../services/api';
import { authService } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';

interface SetupForm {
  gym_nombre: string;
  gym_color: string;
  admin_nombre: string;
  admin_apellido: string;
  admin_email: string;
  admin_password: string;
  admin_password_confirmation: string;
}

export default function SetupPage() {
  const navigate = useNavigate();
  const { refreshConfig } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<SetupForm>({
    defaultValues: {
      gym_color: '#3b82f6'
    }
  });

  const password = watch('admin_password');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: SetupForm) => {
    setError('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('gym_nombre', data.gym_nombre);
      formData.append('gym_color', data.gym_color);
      formData.append('admin_nombre', data.admin_nombre);
      formData.append('admin_apellido', data.admin_apellido);
      formData.append('admin_email', data.admin_email);
      formData.append('admin_password', data.admin_password);
      formData.append('admin_password_confirmation', data.admin_password_confirmation);

      if (logo) {
        formData.append('gym_logo', logo);
      }

      await api.post('/setup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Login automático después del setup
      await authService.login(data.admin_email, data.admin_password);

      // Actualizar el estado de config para que no siga en needsSetup
      await refreshConfig();

      navigate('/entrenador');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError(error.response?.data?.message || 'Error al configurar el sistema');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Dumbbell className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración inicial</h1>
          <p className="text-gray-500 mt-1">Configurá tu gimnasio y creá el usuario administrador</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Gym section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">1</span>
                Datos del gimnasio
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del gimnasio
                </label>
                <input
                  {...register('gym_nombre', { required: 'El nombre es requerido' })}
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mi Gimnasio"
                />
                {errors.gym_nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.gym_nombre.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo (opcional)
                </label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg border" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Dumbbell className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      Subir logo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color principal
                </label>
                <div className="flex items-center gap-3">
                  <input
                    {...register('gym_color')}
                    type="color"
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    {...register('gym_color')}
                    type="text"
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>

            {/* Admin section */}
            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">2</span>
                Usuario administrador
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    {...register('admin_nombre', { required: 'Requerido' })}
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.admin_nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.admin_nombre.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido
                  </label>
                  <input
                    {...register('admin_apellido', { required: 'Requerido' })}
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.admin_apellido && (
                    <p className="mt-1 text-sm text-red-600">{errors.admin_apellido.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...register('admin_email', {
                    required: 'El email es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  type="email"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@gimnasio.com"
                />
                {errors.admin_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.admin_email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  {...register('admin_password', {
                    required: 'La contraseña es requerida',
                    minLength: { value: 8, message: 'Mínimo 8 caracteres' }
                  })}
                  type="password"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.admin_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.admin_password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  {...register('admin_password_confirmation', {
                    required: 'Confirmá la contraseña',
                    validate: value => value === password || 'Las contraseñas no coinciden'
                  })}
                  type="password"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.admin_password_confirmation && (
                  <p className="mt-1 text-sm text-red-600">{errors.admin_password_confirmation.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Configurando...'
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Completar configuración
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
