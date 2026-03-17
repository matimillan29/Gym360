import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface PlanCuota {
  id: number;
  nombre: string;
}

interface Pago {
  id: number;
  fecha: string;
  monto: number;
  metodo: string;
  comprobante?: string;
}

interface Cuota {
  id: number;
  plan: PlanCuota;
  fecha_inicio: string;
  fecha_vencimiento: string;
  monto: number;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'mora';
  pagos: Pago[];
  monto_pagado: number;
}

const estadoConfig: Record<string, { label: string; bg: string; text: string }> = {
  pagado: { label: 'Pagada', bg: 'bg-green-100', text: 'text-green-700' },
  pendiente: { label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  vencido: { label: 'Vencida', bg: 'bg-orange-100', text: 'text-orange-700' },
  mora: { label: 'En mora', bg: 'bg-red-100', text: 'text-red-700' },
};

const metodoLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  debito: 'Débito',
  credito: 'Crédito',
  otro: 'Otro',
};

export default function MisCuotas() {
  const { data: cuotas, isLoading } = useQuery<Cuota[]>({
    queryKey: ['mis-cuotas'],
    queryFn: async () => {
      try {
        const response = await api.get('/mi/cuotas');
        return response.data.data || response.data || [];
      } catch {
        return [];
      }
    },
  });

  const cuotaActual = cuotas?.find(c => c.estado !== 'pagado') || cuotas?.[0];
  const historial = cuotas?.filter(c => c !== cuotaActual) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const diasParaVencer = (fechaVencimiento: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    return Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando cuotas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-amber-600 rounded-2xl p-6 text-white shadow-sm">
        <h1 className="text-3xl font-bold mb-1">Mis Cuotas</h1>
        <p className="text-amber-100">Estado de pagos y historial de cuotas</p>
      </div>

      {/* Cuota actual */}
      {cuotaActual && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Cuota actual</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoConfig[cuotaActual.estado].bg} ${estadoConfig[cuotaActual.estado].text}`}>
                {estadoConfig[cuotaActual.estado].label}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Plan</p>
                <p className="font-semibold text-gray-900">{cuotaActual.plan.nombre}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Monto</p>
                <p className="text-xl font-bold text-gray-900">
                  ${cuotaActual.monto.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Vencimiento</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(cuotaActual.fecha_vencimiento)}
                </p>
                {cuotaActual.estado !== 'pagado' && (
                  <p className={`text-xs mt-1 ${
                    diasParaVencer(cuotaActual.fecha_vencimiento) < 0
                      ? 'text-red-600'
                      : diasParaVencer(cuotaActual.fecha_vencimiento) <= 5
                        ? 'text-orange-600'
                        : 'text-gray-500'
                  }`}>
                    {diasParaVencer(cuotaActual.fecha_vencimiento) < 0
                      ? `Vencida hace ${Math.abs(diasParaVencer(cuotaActual.fecha_vencimiento))} días`
                      : `Vence en ${diasParaVencer(cuotaActual.fecha_vencimiento)} días`}
                  </p>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Pagado</p>
                <p className={`text-xl font-bold ${
                  cuotaActual.monto_pagado >= cuotaActual.monto ? 'text-green-600' : 'text-gray-900'
                }`}>
                  ${cuotaActual.monto_pagado?.toLocaleString() || 0}
                </p>
                {cuotaActual.monto_pagado < cuotaActual.monto && (
                  <p className="text-xs text-gray-500 mt-1">
                    Resta: ${(cuotaActual.monto - (cuotaActual.monto_pagado || 0)).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Pagos de la cuota actual */}
            {cuotaActual.pagos && cuotaActual.pagos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Pagos registrados</h3>
                <div className="space-y-2">
                  {cuotaActual.pagos.map((pago) => (
                    <div
                      key={pago.id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">${pago.monto.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(pago.fecha)} • {metodoLabels[pago.metodo] || pago.metodo}
                          </p>
                        </div>
                      </div>
                      {pago.comprobante && (
                        <span className="text-xs text-gray-400">#{pago.comprobante}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mensaje de estado */}
          {cuotaActual.estado === 'pagado' && (
            <div className="px-6 py-4 bg-green-50 border-t border-green-100">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-800 font-medium">¡Tu cuota está al día!</p>
              </div>
            </div>
          )}

          {(cuotaActual.estado === 'vencido' || cuotaActual.estado === 'mora') && (
            <div className="px-6 py-4 bg-red-50 border-t border-red-100">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-800">Tu cuota está vencida. Acercate al gimnasio para regularizar tu situación.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sin cuotas */}
      {!cuotaActual && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay cuotas registradas</h3>
          <p className="text-gray-500">Tu entrenador registrará tu cuota cuando corresponda</p>
        </div>
      )}

      {/* Historial de cuotas anteriores */}
      {historial.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Historial de cuotas</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {historial.map((cuota) => (
              <div key={cuota.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      cuota.estado === 'pagado' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {cuota.estado === 'pagado' ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cuota.plan.nombre}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(cuota.fecha_inicio)} - {formatDate(cuota.fecha_vencimiento)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${cuota.monto.toLocaleString()}</p>
                    <span className={`text-xs ${estadoConfig[cuota.estado].text}`}>
                      {estadoConfig[cuota.estado].label}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen */}
      {cuotas && cuotas.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total pagado históricamente</span>
            <span className="font-semibold text-gray-900">
              ${cuotas.reduce((acc, c) => acc + (c.monto_pagado || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
