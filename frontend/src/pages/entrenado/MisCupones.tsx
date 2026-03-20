import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Negocio {
  id: number;
  nombre: string;
  logo: string | null;
  direccion: string | null;
  telefono: string | null;
  instagram: string | null;
}

interface Cupon {
  id: number;
  titulo: string;
  descripcion: string | null;
  codigo: string | null;
  tipo_descuento: 'porcentaje' | 'monto_fijo' | 'especial';
  valor_descuento: number | null;
  negocio: Negocio;
}

interface CuponEntrenado {
  id: number;
  cupon: Cupon;
  fecha_asignacion: string;
  fecha_vencimiento: string;
  canjeado: boolean;
  fecha_canje: string | null;
  motivo: string;
}

interface CuponesData {
  vigentes: CuponEntrenado[];
  historial: CuponEntrenado[];
}

export default function MisCupones() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'vigentes' | 'historial'>('vigentes');
  const [selectedCupon, setSelectedCupon] = useState<CuponEntrenado | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['mis-cupones'],
    queryFn: async () => {
      const response = await api.get('/mi/cupones');
      return response.data.data as CuponesData;
    },
  });

  const canjearMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/mi/cupones/${id}/canjear`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-cupones'] });
      setSelectedCupon(null);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al canjear el cupón';
      toast.error(msg);
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDescuento = (cupon: Cupon) => {
    if (cupon.tipo_descuento === 'porcentaje' && cupon.valor_descuento) {
      return `${cupon.valor_descuento}% OFF`;
    }
    if (cupon.tipo_descuento === 'monto_fijo' && cupon.valor_descuento) {
      return `$${cupon.valor_descuento} OFF`;
    }
    return 'Descuento Especial';
  };

  const getDaysRemaining = (fechaVencimiento: string) => {
    const today = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const cupones = activeTab === 'vigentes' ? data?.vigentes : data?.historial;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Cupones</h1>
        <p className="text-gray-600 dark:text-gray-400">Tus descuentos y beneficios exclusivos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('vigentes')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'vigentes'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Vigentes
          {data?.vigentes && data.vigentes.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white dark:bg-gray-800 rounded-full text-sm">
              {data.vigentes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'historial'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Historial
        </button>
      </div>

      {/* Lista de cupones */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">Cargando cupones...</p>
        </div>
      ) : !cupones || cupones.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'vigentes'
              ? 'No tenés cupones vigentes en este momento'
              : 'No hay cupones en tu historial'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cupones.map((cuponEntrenado) => {
            const daysRemaining = getDaysRemaining(cuponEntrenado.fecha_vencimiento);
            const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
            const isExpired = daysRemaining <= 0;

            return (
              <div
                key={cuponEntrenado.id}
                onClick={() => !cuponEntrenado.canjeado && !isExpired && setSelectedCupon(cuponEntrenado)}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden ${
                  !cuponEntrenado.canjeado && !isExpired ? 'cursor-pointer hover:shadow-md' : ''
                } transition-shadow relative ${
                  cuponEntrenado.canjeado || isExpired ? 'opacity-60' : ''
                }`}
              >
                {/* Marca de usado/vencido */}
                {(cuponEntrenado.canjeado || isExpired) && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className={`px-4 py-2 text-lg font-bold rounded-lg transform -rotate-12 ${
                      cuponEntrenado.canjeado
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-600 border-2 border-green-600'
                        : 'bg-red-100 dark:bg-red-900/50 text-red-600 border-2 border-red-600'
                    }`}>
                      {cuponEntrenado.canjeado ? 'CANJEADO' : 'VENCIDO'}
                    </span>
                  </div>
                )}

                <div className="flex">
                  {/* Logo del negocio */}
                  <div className="w-24 sm:w-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
                    {cuponEntrenado.cupon.negocio?.logo ? (
                      <img
                        src={cuponEntrenado.cupon.negocio.logo}
                        alt={cuponEntrenado.cupon.negocio.nombre}
                        className="max-h-20 object-contain"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-gray-300 dark:text-gray-600">
                        {cuponEntrenado.cupon.negocio?.nombre?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {cuponEntrenado.cupon.titulo}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {cuponEntrenado.cupon.negocio?.nombre}
                        </p>
                      </div>
                      {cuponEntrenado.motivo === 'cumpleanos' && (
                        <span className="text-2xl" title="Regalo de cumpleaños">🎂</span>
                      )}
                    </div>

                    <div className="mt-3">
                      <span className="inline-flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 rounded-full text-sm font-bold">
                        {formatDescuento(cuponEntrenado.cupon)}
                      </span>
                    </div>

                    {cuponEntrenado.cupon.codigo && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Código: </span>
                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {cuponEntrenado.cupon.codigo}
                        </span>
                      </div>
                    )}

                    <div className="mt-3 text-xs">
                      {cuponEntrenado.canjeado ? (
                        <span className="text-green-600">
                          Canjeado el {formatDate(cuponEntrenado.fecha_canje!)}
                        </span>
                      ) : isExpired ? (
                        <span className="text-red-600">
                          Venció el {formatDate(cuponEntrenado.fecha_vencimiento)}
                        </span>
                      ) : isExpiringSoon ? (
                        <span className="text-orange-600 font-medium">
                          ¡Vence en {daysRemaining} día{daysRemaining !== 1 ? 's' : ''}!
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          Válido hasta {formatDate(cuponEntrenado.fecha_vencimiento)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal detalle del cupón */}
      {selectedCupon && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            {/* Header con logo */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-center text-white">
              {selectedCupon.cupon.negocio?.logo ? (
                <div className="w-20 h-20 mx-auto bg-white dark:bg-gray-800 rounded-xl p-2 mb-4">
                  <img
                    src={selectedCupon.cupon.negocio.logo}
                    alt={selectedCupon.cupon.negocio.nombre}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold">
                    {selectedCupon.cupon.negocio?.nombre?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <h2 className="text-2xl font-bold">{selectedCupon.cupon.titulo}</h2>
              <p className="text-blue-100">{selectedCupon.cupon.negocio?.nombre}</p>
            </div>

            {/* Descuento destacado */}
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-y-4 border-dashed border-yellow-200 dark:border-yellow-800 py-6 text-center">
              <span className="text-3xl font-bold text-yellow-700">
                {formatDescuento(selectedCupon.cupon)}
              </span>
              {selectedCupon.cupon.codigo && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Presentá este código:</p>
                  <span className="font-mono text-xl bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300">
                    {selectedCupon.cupon.codigo}
                  </span>
                </div>
              )}
            </div>

            {/* Detalles */}
            <div className="p-6 space-y-4">
              {selectedCupon.cupon.descripcion && (
                <p className="text-gray-600 dark:text-gray-400">{selectedCupon.cupon.descripcion}</p>
              )}

              {/* Info del negocio */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Información del negocio</h4>
                {selectedCupon.cupon.negocio?.direccion && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {selectedCupon.cupon.negocio.direccion}
                  </p>
                )}
                {selectedCupon.cupon.negocio?.telefono && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {selectedCupon.cupon.negocio.telefono}
                  </p>
                )}
                {selectedCupon.cupon.negocio?.instagram && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    @{selectedCupon.cupon.negocio.instagram}
                  </p>
                )}
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Válido hasta {formatDate(selectedCupon.fecha_vencimiento)}
              </p>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedCupon(null)}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Marcar este cupón como canjeado? Esta acción no se puede deshacer.')) {
                      canjearMutation.mutate(selectedCupon.id);
                    }
                  }}
                  disabled={canjearMutation.isPending}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {canjearMutation.isPending ? 'Canjeando...' : 'Marcar como canjeado'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
