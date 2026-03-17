import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface GymConfig {
  id?: number;
  nombre: string;
  logo?: string;
  color_principal: string;
  color_secundario: string;
  multi_sucursal?: boolean;
  direccion?: string;
  telefono?: string;
  email?: string;
  redes_sociales?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  dias_aviso_vencimiento: number;
  notificar_vencimiento: boolean;
  notificar_nuevo_plan: boolean;
}

interface SmtpConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password?: string;
  smtp_encryption: string;
  smtp_from_address: string;
  smtp_from_name: string;
  has_password?: boolean;
}

export default function ConfiguracionGym() {
  const queryClient = useQueryClient();
  const { refreshConfig } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'branding' | 'contacto' | 'notificaciones' | 'superadmin'>('branding');

  const [config, setConfig] = useState<GymConfig>({
    nombre: '',
    color_principal: '#3b82f6',
    color_secundario: '#64748b',
    multi_sucursal: false,
    dias_aviso_vencimiento: 5,
    notificar_vencimiento: true,
    notificar_nuevo_plan: true,
    redes_sociales: {},
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ nombre?: string }>({});
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Super Admin state
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [superAdminUnlocked, setSuperAdminUnlocked] = useState(false);
  const [superAdminError, setSuperAdminError] = useState('');
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    smtp_from_address: '',
    smtp_from_name: '',
  });
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [smtpSaveResult, setSmtpSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch config (usar endpoint completo para admin)
  const { data: fetchedConfig, isLoading } = useQuery<GymConfig>({
    queryKey: ['gym-config-admin'],
    queryFn: async () => {
      const response = await api.get('/config/full');
      return response.data.data || response.data;
    },
  });

  // Sync fetched config to local state
  useEffect(() => {
    if (fetchedConfig) {
      setConfig(fetchedConfig);
      if (fetchedConfig.logo) {
        setLogoPreview(fetchedConfig.logo);
      }
    }
  }, [fetchedConfig]);

  // Mutation para guardar config
  const saveConfigMutation = useMutation({
    mutationFn: async (data: GymConfig) => {
      return api.put('/config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-config-admin'] });
      refreshConfig(); // Actualizar el contexto global para reflejar cambios en header/sidebar
    },
  });

  // Mutation para subir logo
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      return api.post('/config/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-config-admin'] });
      refreshConfig(); // Actualizar el contexto global para reflejar nuevo logo en header/sidebar
      setLogoFile(null);
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validar nombre
    if (!config.nombre.trim()) {
      setErrors({ nombre: 'El nombre del gimnasio es obligatorio' });
      setActiveTab('branding');
      return;
    }
    setErrors({});

    if (logoFile) {
      await uploadLogoMutation.mutateAsync(logoFile);
    }
    saveConfigMutation.mutate(config);
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      await api.post('/config/test-email');
      setEmailTestResult({ success: true, message: 'Email de prueba enviado correctamente. Revisá tu casilla.' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar email de prueba';
      setEmailTestResult({ success: false, message: errorMessage });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleUnlockSuperAdmin = async () => {
    setSuperAdminError('');
    try {
      const response = await api.post('/config/super-admin/verify', { password: superAdminPassword });
      if (response.data.valid) {
        setSuperAdminUnlocked(true);
        // Cargar config SMTP
        const smtpResponse = await api.post('/config/super-admin/smtp', { password: superAdminPassword });
        if (smtpResponse.data.data) {
          setSmtpConfig({
            ...smtpResponse.data.data,
            smtp_password: '', // No mostrar password existente
          });
        }
      }
    } catch {
      setSuperAdminError('Contraseña incorrecta');
    }
  };

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    setSmtpSaveResult(null);
    try {
      await api.put('/config/super-admin/smtp', {
        password: superAdminPassword,
        ...smtpConfig,
      });
      setSmtpSaveResult({ success: true, message: 'Configuración SMTP guardada correctamente' });
      setSmtpConfig({ ...smtpConfig, smtp_password: '' }); // Limpiar password del form
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar configuración';
      setSmtpSaveResult({ success: false, message: errorMessage });
    } finally {
      setSavingSmtp(false);
    }
  };

  const tabs = [
    { id: 'branding', label: 'Branding', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { id: 'contacto', label: 'Contacto', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'notificaciones', label: 'Notificaciones', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'superadmin', label: 'Super Admin', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-gray-700 rounded-2xl p-6 text-white shadow-sm">
        <h1 className="text-3xl font-bold">Configuración del Gimnasio</h1>
        <p className="text-gray-300 mt-1">Personalizá la apariencia y datos de tu gimnasio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 py-3 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Identidad Visual</h3>

              {/* Logo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo del gimnasio
                </label>
                <div className="flex items-center gap-6">
                  <div
                    className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center">
                        <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-500">Subir logo</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="text-sm text-gray-500">
                    <p>Formatos: PNG, JPG</p>
                    <p>Tamaño máximo: 2MB</p>
                    <p>Recomendado: 512x512px</p>
                  </div>
                </div>
              </div>

              {/* Nombre */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del gimnasio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.nombre}
                  onChange={(e) => {
                    setConfig({ ...config, nombre: e.target.value });
                    if (errors.nombre) setErrors({});
                  }}
                  placeholder="Mi Gimnasio"
                  className={`w-full max-w-md px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.nombre ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {errors.nombre}
                  </p>
                )}
              </div>

              {/* Colores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color principal
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.color_principal}
                      onChange={(e) => setConfig({ ...config, color_principal: e.target.value })}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.color_principal}
                      onChange={(e) => setConfig({ ...config, color_principal: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color secundario
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.color_secundario}
                      onChange={(e) => setConfig({ ...config, color_secundario: e.target.value })}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.color_secundario}
                      onChange={(e) => setConfig({ ...config, color_secundario: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Vista previa</h4>
                <div
                  className="rounded-lg p-4 text-white"
                  style={{ backgroundColor: config.color_principal }}
                >
                  <div className="flex items-center gap-3">
                    {logoPreview && (
                      <img src={logoPreview} alt="" className="w-12 h-12 rounded-lg bg-white p-1" />
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{config.nombre || 'Nombre del gimnasio'}</h3>
                      <p className="text-sm opacity-75">Tu eslogan aquí</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contacto Tab */}
        {activeTab === 'contacto' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={config.direccion || ''}
                  onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                  placeholder="Calle 123, Ciudad"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={config.telefono || ''}
                  onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                  placeholder="+54 11 1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email de contacto
                </label>
                <input
                  type="email"
                  value={config.email || ''}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  placeholder="info@migimnasio.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <hr className="my-6" />

            <h4 className="text-md font-medium text-gray-900 mb-4">Redes Sociales</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={config.redes_sociales?.instagram || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        redes_sociales: { ...config.redes_sociales, instagram: e.target.value },
                      })
                    }
                    placeholder="migimnasio"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook
                </label>
                <input
                  type="text"
                  value={config.redes_sociales?.facebook || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      redes_sociales: { ...config.redes_sociales, facebook: e.target.value },
                    })
                  }
                  placeholder="URL de Facebook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={config.redes_sociales?.whatsapp || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      redes_sociales: { ...config.redes_sociales, whatsapp: e.target.value },
                    })
                  }
                  placeholder="+54 11 1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notificaciones Tab */}
        {activeTab === 'notificaciones' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Notificaciones</h3>

            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Aviso de cuota por vencer</h4>
                  <p className="text-sm text-gray-500">
                    Notificar al entrenado cuando su cuota esté por vencer
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, notificar_vencimiento: !config.notificar_vencimiento })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    config.notificar_vencimiento ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      config.notificar_vencimiento ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {config.notificar_vencimiento && (
                <div className="ml-4 p-4 border-l-2 border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días de anticipación
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={config.dias_aviso_vencimiento}
                      onChange={(e) =>
                        setConfig({ ...config, dias_aviso_vencimiento: parseInt(e.target.value) })
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-600">días antes del vencimiento</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Notificar nuevo plan</h4>
                  <p className="text-sm text-gray-500">
                    Enviar email cuando se asigna un nuevo plan de entrenamiento
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, notificar_nuevo_plan: !config.notificar_nuevo_plan })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    config.notificar_nuevo_plan ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      config.notificar_nuevo_plan ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Test de email */}
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Probar configuración de email</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Enviá un email de prueba para verificar que la configuración SMTP funciona correctamente.
                </p>
                <button
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {testingEmail ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Enviar email de prueba
                    </>
                  )}
                </button>
                {emailTestResult && (
                  <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                    emailTestResult.success
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {emailTestResult.success ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {emailTestResult.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Super Admin Tab */}
        {activeTab === 'superadmin' && (
          <div className="space-y-6">
            {!superAdminUnlocked ? (
              <div className="max-w-md mx-auto text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso restringido</h3>
                <p className="text-gray-500 mb-6">
                  Esta sección permite configurar el servidor de correo (SMTP) y otras opciones avanzadas.
                  Ingresá la contraseña de super administrador para continuar.
                </p>
                <div className="flex gap-2 max-w-xs mx-auto">
                  <input
                    type="password"
                    value={superAdminPassword}
                    onChange={(e) => setSuperAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlockSuperAdmin()}
                    placeholder="Contraseña"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleUnlockSuperAdmin}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Desbloquear
                  </button>
                </div>
                {superAdminError && (
                  <p className="mt-3 text-sm text-red-600">{superAdminError}</p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <span className="text-green-600 font-medium">Sesión de super admin activa</span>
                </div>

                {/* Modo Multi-Sucursal */}
                <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Modo Multi-Sucursal</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Habilita la gestión de múltiples sedes del gimnasio
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, multi_sucursal: !config.multi_sucursal })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        config.multi_sucursal ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          config.multi_sucursal ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {config.multi_sucursal && (
                    <p className="text-sm text-blue-700 mt-3">
                      Podés gestionar las sucursales desde el menú Admin → Sucursales
                    </p>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración SMTP</h3>
                <p className="text-gray-500 mb-6">
                  Configurá el servidor de correo saliente para enviar emails de notificaciones.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Host SMTP
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.smtp_host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puerto
                    </label>
                    <input
                      type="number"
                      value={smtpConfig.smtp_port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_port: parseInt(e.target.value) })}
                      placeholder="587"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuario SMTP
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.smtp_username}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_username: e.target.value })}
                      placeholder="tu-email@gmail.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña SMTP {smtpConfig.has_password && <span className="text-green-600">(configurada)</span>}
                    </label>
                    <input
                      type="password"
                      value={smtpConfig.smtp_password}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_password: e.target.value })}
                      placeholder={smtpConfig.has_password ? '••••••••' : 'App password'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Encriptación
                    </label>
                    <select
                      value={smtpConfig.smtp_encryption}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_encryption: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="tls">TLS (recomendado)</option>
                      <option value="ssl">SSL</option>
                      <option value="null">Ninguna</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email de origen
                    </label>
                    <input
                      type="email"
                      value={smtpConfig.smtp_from_address}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_from_address: e.target.value })}
                      placeholder="noreply@migimnasio.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de origen
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.smtp_from_name}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_from_name: e.target.value })}
                      placeholder="Mi Gimnasio"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <button
                    onClick={handleSaveSmtp}
                    disabled={savingSmtp}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {savingSmtp ? 'Guardando...' : 'Guardar configuración SMTP'}
                  </button>
                  <button
                    onClick={() => {
                      setSuperAdminUnlocked(false);
                      setSuperAdminPassword('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Bloquear sesión
                  </button>
                </div>

                {smtpSaveResult && (
                  <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                    smtpSaveResult.success
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {smtpSaveResult.success ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {smtpSaveResult.message}
                  </div>
                )}

                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2">Proveedores comunes</h4>
                  <div className="text-sm text-amber-700 space-y-1">
                    <p><strong>Gmail:</strong> smtp.gmail.com:587 (requiere App Password)</p>
                    <p><strong>Outlook:</strong> smtp.office365.com:587</p>
                    <p><strong>SendGrid:</strong> smtp.sendgrid.net:587</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['gym-config-admin'] })}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Descartar cambios
        </button>
        <button
          onClick={handleSave}
          disabled={saveConfigMutation.isPending || uploadLogoMutation.isPending}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saveConfigMutation.isPending || uploadLogoMutation.isPending
            ? 'Guardando...'
            : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
