import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface Medidas {
  hombros?: number;
  torax?: number;
  cintura?: number;
  cadera?: number;
  brazo_derecho?: number;
  brazo_izquierdo?: number;
}

interface Anamnesis {
  peso?: number;
  altura?: number;
  experiencia_gym?: string;
  objetivos_principales?: string;
  objetivos_secundarios?: string;
  disponibilidad_dias?: number;
  tiempo_por_sesion?: string;
  medidas?: Medidas;
}

interface Link {
  id: number;
  titulo: string;
  url: string;
  descripcion?: string;
  categoria: string;
}

interface Cuota {
  id: number;
  plan: {
    nombre: string;
  };
  fecha_inicio: string;
  fecha_vencimiento: string;
  monto: number;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'mora';
}

interface Feedback {
  id: number;
  tipo: string;
  contenido: string;
  created_at: string;
  entrenador?: {
    nombre: string;
    apellido: string;
  };
}

export default function MiPerfil() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('foto', file);
      const response = await api.post('/mi/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['mi-perfil'] });
    },
  });

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no puede superar los 2MB');
      return;
    }

    setIsUploading(true);
    try {
      await uploadPhotoMutation.mutateAsync(file);
    } catch {
      alert('Error al subir la foto');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const { data: anamnesis } = useQuery<Anamnesis | null>({
    queryKey: ['mi-anamnesis'],
    queryFn: async () => {
      try {
        const response = await api.get('/mi/anamnesis');
        return response.data.data || response.data;
      } catch {
        return null;
      }
    },
  });

  const { data: links } = useQuery<Link[]>({
    queryKey: ['mis-links'],
    queryFn: async () => {
      try {
        const response = await api.get('/mi/links');
        return response.data.data || response.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: cuotaActual } = useQuery<Cuota | null>({
    queryKey: ['mi-cuota'],
    queryFn: async () => {
      try {
        const response = await api.get('/mi/cuotas');
        const cuotas = response.data.data || [];
        return cuotas.length > 0 ? cuotas[0] : null;
      } catch {
        return null;
      }
    },
  });

  const { data: feedbackList = [] } = useQuery<Feedback[]>({
    queryKey: ['mi-feedback'],
    queryFn: async () => {
      try {
        const response = await api.get('/mi/feedbacks');
        return response.data.data || response.data || [];
      } catch {
        return [];
      }
    },
  });

  const calcularIMC = () => {
    if (anamnesis?.peso && anamnesis?.altura) {
      const alturaM = anamnesis.altura / 100;
      return (anamnesis.peso / (alturaM * alturaM)).toFixed(1);
    }
    return null;
  };

  const getExperienciaLabel = (exp?: string) => {
    const labels: Record<string, string> = {
      ninguna: 'Sin experiencia',
      principiante: 'Principiante',
      intermedio: 'Intermedio',
      avanzado: 'Avanzado',
    };
    return exp ? labels[exp] || exp : '-';
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'video_tecnica':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'articulo':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
    }
  };

  const getCuotaStatusInfo = (estado: string) => {
    const info: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
      pagado: {
        label: 'Al día',
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200',
        icon: (
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      pendiente: {
        label: 'Pendiente',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50 border-yellow-200',
        icon: (
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      vencido: {
        label: 'Vencida',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50 border-orange-200',
        icon: (
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      },
      mora: {
        label: 'En mora',
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200',
        icon: (
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
    };
    return info[estado] || info.pendiente;
  };

  const getFeedbackTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      progreso: 'Progreso',
      actitud: 'Actitud',
      asistencia: 'Asistencia',
      tecnica: 'Técnica',
      otro: 'Otro'
    };
    return labels[tipo] || tipo;
  };

  const diasParaVencer = (fechaVencimiento: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diff = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="bg-green-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePhotoClick}
            disabled={isUploading}
            className="relative h-20 w-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden group hover:ring-4 hover:ring-white/30 transition-all cursor-pointer disabled:opacity-50"
            title="Cambiar foto de perfil"
          >
            {user?.foto ? (
              <img
                src={user.foto}
                alt={`${user.nombre} ${user.apellido}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold">
                {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
              </span>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {isUploading ? (
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">
              {user?.nombre} {user?.apellido}
            </h1>
            <p className="text-green-100">{user?.email}</p>
            {user?.entrenador && (
              <div className="flex items-center gap-2 mt-2 text-green-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm">
                  Entrenador: {user.entrenador.nombre} {user.entrenador.apellido}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estado de cuota */}
      {cuotaActual && (
        <div className={`rounded-xl border p-4 ${getCuotaStatusInfo(cuotaActual.estado).bgColor}`}>
          <div className="flex items-center gap-4">
            {getCuotaStatusInfo(cuotaActual.estado).icon}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${getCuotaStatusInfo(cuotaActual.estado).color}`}>
                  Cuota: {getCuotaStatusInfo(cuotaActual.estado).label}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {cuotaActual.plan.nombre} - ${cuotaActual.monto.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {cuotaActual.estado === 'pagado' ? (
                  <>Vence el {new Date(cuotaActual.fecha_vencimiento).toLocaleDateString('es-AR')}</>
                ) : cuotaActual.estado === 'vencido' || cuotaActual.estado === 'mora' ? (
                  <>Venció el {new Date(cuotaActual.fecha_vencimiento).toLocaleDateString('es-AR')}</>
                ) : (
                  <>
                    Vence en {diasParaVencer(cuotaActual.fecha_vencimiento)} días
                    ({new Date(cuotaActual.fecha_vencimiento).toLocaleDateString('es-AR')})
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Datos personales */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Datos personales</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">DNI</p>
            <p className="font-medium text-gray-900">{user?.dni || '-'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Teléfono</p>
            <p className="font-medium text-gray-900">{user?.telefono || '-'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Fecha de nacimiento</p>
            <p className="font-medium text-gray-900">
              {user?.fecha_nacimiento
                ? new Date(user.fecha_nacimiento).toLocaleDateString('es-AR')
                : '-'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Profesión</p>
            <p className="font-medium text-gray-900">{user?.profesion || '-'}</p>
          </div>
        </div>
      </div>

      {/* Anamnesis */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Anamnesis deportiva</h2>
        </div>

        {anamnesis ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs text-green-600 mb-1">Peso</p>
                <p className="text-2xl font-bold text-green-700">
                  {anamnesis.peso ? `${anamnesis.peso} kg` : '-'}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 mb-1">Altura</p>
                <p className="text-2xl font-bold text-blue-700">
                  {anamnesis.altura ? `${anamnesis.altura} cm` : '-'}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-xs text-purple-600 mb-1">IMC</p>
                <p className="text-2xl font-bold text-purple-700">
                  {calcularIMC() || '-'}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-600 mb-1">Experiencia</p>
                <p className="text-lg font-bold text-orange-700">
                  {getExperienciaLabel(anamnesis.experiencia_gym)}
                </p>
              </div>
            </div>

            {/* Medidas corporales */}
            {anamnesis.medidas && Object.values(anamnesis.medidas).some(v => v) && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-3">Medidas corporales (cm)</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {anamnesis.medidas.hombros && (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{anamnesis.medidas.hombros}</p>
                      <p className="text-xs text-gray-500">Hombros</p>
                    </div>
                  )}
                  {anamnesis.medidas.torax && (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{anamnesis.medidas.torax}</p>
                      <p className="text-xs text-gray-500">Tórax</p>
                    </div>
                  )}
                  {anamnesis.medidas.cintura && (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{anamnesis.medidas.cintura}</p>
                      <p className="text-xs text-gray-500">Cintura</p>
                    </div>
                  )}
                  {anamnesis.medidas.cadera && (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{anamnesis.medidas.cadera}</p>
                      <p className="text-xs text-gray-500">Cadera</p>
                    </div>
                  )}
                  {anamnesis.medidas.brazo_derecho && (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{anamnesis.medidas.brazo_derecho}</p>
                      <p className="text-xs text-gray-500">Brazo D</p>
                    </div>
                  )}
                  {anamnesis.medidas.brazo_izquierdo && (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{anamnesis.medidas.brazo_izquierdo}</p>
                      <p className="text-xs text-gray-500">Brazo I</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Objetivos principales</p>
                <p className="font-medium text-gray-900">
                  {anamnesis.objetivos_principales || 'No definidos'}
                </p>
              </div>
              {anamnesis.objetivos_secundarios && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Objetivos secundarios</p>
                  <p className="font-medium text-gray-900">
                    {anamnesis.objetivos_secundarios}
                  </p>
                </div>
              )}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Disponibilidad</p>
                <p className="font-medium text-gray-900">
                  {anamnesis.disponibilidad_dias
                    ? `${anamnesis.disponibilidad_dias} días por semana`
                    : 'No definida'}
                  {anamnesis.tiempo_por_sesion && ` • ${anamnesis.tiempo_por_sesion}`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Tu anamnesis deportiva aparecerá aquí</p>
            <p className="text-sm">Tu entrenador completará esta información</p>
          </div>
        )}
      </div>

      {/* Feedback del entrenador */}
      {feedbackList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Feedback de tu entrenador</h2>
          </div>

          <div className="space-y-3">
            {feedbackList.slice(0, 5).map((fb) => (
              <div key={fb.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    fb.tipo === 'progreso' ? 'bg-green-100 text-green-700' :
                    fb.tipo === 'tecnica' ? 'bg-blue-100 text-blue-700' :
                    fb.tipo === 'asistencia' ? 'bg-yellow-100 text-yellow-700' :
                    fb.tipo === 'actitud' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getFeedbackTipoLabel(fb.tipo)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(fb.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <p className="text-gray-700">{fb.contenido}</p>
                {fb.entrenador && (
                  <p className="text-xs text-gray-400 mt-2">
                    Por {fb.entrenador.nombre} {fb.entrenador.apellido}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links útiles */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Links útiles</h2>
        </div>

        {links && links.length > 0 ? (
          <div className="space-y-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  {getCategoriaIcon(link.categoria)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {link.titulo}
                  </p>
                  {link.descripcion && (
                    <p className="text-sm text-gray-500 truncate">{link.descripcion}</p>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p>Tu entrenador puede adjuntarte links útiles aquí</p>
            <p className="text-sm">Videos de técnica, artículos, recursos, etc.</p>
          </div>
        )}
      </div>
    </div>
  );
}
