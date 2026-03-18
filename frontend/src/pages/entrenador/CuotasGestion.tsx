import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Entrenado {
  id: number;
  nombre: string;
  apellido: string;
}

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
  notas?: string;
}

interface Cuota {
  id: number;
  entrenado: Entrenado;
  plan: PlanCuota;
  fecha_inicio: string;
  fecha_vencimiento: string;
  monto: number;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'mora';
  pagos: Pago[];
  total_pagado: number;
}

interface PagoForm {
  monto: string;
  metodo: string;
  comprobante: string;
  notas: string;
  fecha: string;
}

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'otro', label: 'Otro' },
];

export default function CuotasGestion() {
  const queryClient = useQueryClient();
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState<Cuota | null>(null);
  const [pagoForm, setPagoForm] = useState<PagoForm>({
    monto: '',
    metodo: 'efectivo',
    comprobante: '',
    notas: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  // Fetch cuotas
  const { data: cuotas = [], isLoading } = useQuery<Cuota[]>({
    queryKey: ['cuotas', filterEstado],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterEstado) params.append('estado', filterEstado);
      const response = await api.get(`/cuotas?${params.toString()}`);
      return response.data.data || response.data || [];
    },
  });

  // Mutation para registrar pago
  const registrarPagoMutation = useMutation({
    mutationFn: async ({ cuotaId, pago }: { cuotaId: number; pago: PagoForm }) => {
      return api.post(`/cuotas/${cuotaId}/pagos`, {
        ...pago,
        monto: parseFloat(pago.monto),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuotas'] });
      closePagoModal();
      toast.success('Pago registrado correctamente');
    },
  });

  const openPagoModal = (cuota: Cuota) => {
    setSelectedCuota(cuota);
    const montoPendiente = cuota.monto - (cuota.total_pagado || 0);
    setPagoForm({
      monto: montoPendiente.toString(),
      metodo: 'efectivo',
      comprobante: '',
      notas: '',
      fecha: new Date().toISOString().split('T')[0],
    });
    setShowPagoModal(true);
  };

  const closePagoModal = () => {
    setShowPagoModal(false);
    setSelectedCuota(null);
    setPagoForm({
      monto: '',
      metodo: 'efectivo',
      comprobante: '',
      notas: '',
      fecha: new Date().toISOString().split('T')[0],
    });
  };

  const handleRegistrarPago = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCuota || !pagoForm.monto) return;
    registrarPagoMutation.mutate({
      cuotaId: selectedCuota.id,
      pago: pagoForm,
    });
  };

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      pagado: { bg: 'bg-green-100', text: 'text-green-700', label: 'Pagado' },
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
      vencido: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Vencido' },
      mora: { bg: 'bg-red-100', text: 'text-red-700', label: 'En mora' },
    };
    const c = config[estado] || config.pendiente;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  // Agrupar por estado para resumen
  const resumen = cuotas.reduce(
    (acc, cuota) => {
      acc[cuota.estado] = (acc[cuota.estado] || 0) + 1;
      acc.total++;
      if (cuota.estado !== 'pagado') {
        acc.montoTotal += cuota.monto - (cuota.total_pagado || 0);
      }
      return acc;
    },
    { pagado: 0, pendiente: 0, vencido: 0, mora: 0, total: 0, montoTotal: 0 } as Record<string, number>
  );

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Cuotas</h1>
            <p className="text-emerald-100 mt-1">Control de pagos y cobranzas</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="px-4 py-2 bg-white/20 rounded-lg">
              <span className="text-emerald-100">Por cobrar:</span>
              <span className="font-bold ml-2">{formatMoney(resumen.montoTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilterEstado('')}
          className={`bg-white rounded-xl p-4 shadow-sm text-left transition-colors ${
            filterEstado === '' ? 'ring-2 ring-emerald-500' : ''
          }`}
        >
          <p className="text-2xl font-bold text-gray-900">{resumen.total}</p>
          <p className="text-sm text-gray-500">Total cuotas</p>
        </button>
        <button
          onClick={() => setFilterEstado('pendiente')}
          className={`bg-white rounded-xl p-4 shadow-sm text-left transition-colors ${
            filterEstado === 'pendiente' ? 'ring-2 ring-yellow-500' : ''
          }`}
        >
          <p className="text-2xl font-bold text-yellow-600">{resumen.pendiente}</p>
          <p className="text-sm text-gray-500">Pendientes</p>
        </button>
        <button
          onClick={() => setFilterEstado('vencido')}
          className={`bg-white rounded-xl p-4 shadow-sm text-left transition-colors ${
            filterEstado === 'vencido' ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <p className="text-2xl font-bold text-orange-600">{resumen.vencido}</p>
          <p className="text-sm text-gray-500">Vencidas</p>
        </button>
        <button
          onClick={() => setFilterEstado('mora')}
          className={`bg-white rounded-xl p-4 shadow-sm text-left transition-colors ${
            filterEstado === 'mora' ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <p className="text-2xl font-bold text-red-600">{resumen.mora}</p>
          <p className="text-sm text-gray-500">En mora</p>
        </button>
      </div>

      {/* Lista de cuotas */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <p className="text-gray-500">Cargando cuotas...</p>
        </div>
      ) : cuotas.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrenado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cuotas.map((cuota) => {
                  const montoPendiente = cuota.monto - (cuota.total_pagado || 0);
                  return (
                    <tr key={cuota.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/entrenador/entrenados/${cuota.entrenado.id}`}
                          className="flex items-center gap-3 hover:text-emerald-600"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-sm">
                            {cuota.entrenado.nombre[0]}{cuota.entrenado.apellido[0]}
                          </div>
                          <span className="font-medium text-gray-900">
                            {cuota.entrenado.nombre} {cuota.entrenado.apellido}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cuota.plan.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cuota.fecha_vencimiento).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{formatMoney(cuota.monto)}</p>
                          {cuota.total_pagado > 0 && cuota.total_pagado < cuota.monto && (
                            <p className="text-xs text-gray-500">
                              Pagado: {formatMoney(cuota.total_pagado)} | Resta: {formatMoney(montoPendiente)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(cuota.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cuota.estado !== 'pagado' && (
                          <button
                            onClick={() => openPagoModal(cuota)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                          >
                            Registrar pago
                          </button>
                        )}
                        {cuota.pagos && cuota.pagos.length > 0 && (
                          <span className="ml-2 text-xs text-gray-400">
                            {cuota.pagos.length} pago{cuota.pagos.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {filterEstado ? 'No hay cuotas con este estado' : 'No hay cuotas registradas'}
          </h3>
          <p className="text-gray-500">Las cuotas se crean desde el perfil de cada entrenado</p>
        </div>
      )}

      {/* Modal registrar pago */}
      {showPagoModal && selectedCuota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <form onSubmit={handleRegistrarPago}>
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Registrar Pago</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedCuota.entrenado.nombre} {selectedCuota.entrenado.apellido} - {selectedCuota.plan.nombre}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Info de la cuota */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monto total:</span>
                    <span className="font-medium">{formatMoney(selectedCuota.monto)}</span>
                  </div>
                  {selectedCuota.total_pagado > 0 && (
                    <>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Ya pagado:</span>
                        <span className="font-medium text-green-600">{formatMoney(selectedCuota.total_pagado)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1 pt-1 border-t">
                        <span className="text-gray-500">Pendiente:</span>
                        <span className="font-medium text-orange-600">
                          {formatMoney(selectedCuota.monto - selectedCuota.total_pagado)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto a pagar *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pagoForm.monto}
                    onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Método */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de pago
                  </label>
                  <select
                    value={pagoForm.metodo}
                    onChange={(e) => setPagoForm({ ...pagoForm, metodo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {METODOS_PAGO.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha del pago
                  </label>
                  <input
                    type="date"
                    value={pagoForm.fecha}
                    onChange={(e) => setPagoForm({ ...pagoForm, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Comprobante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comprobante (opcional)
                  </label>
                  <input
                    type="text"
                    value={pagoForm.comprobante}
                    onChange={(e) => setPagoForm({ ...pagoForm, comprobante: e.target.value })}
                    placeholder="Número de comprobante o referencia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={pagoForm.notas}
                    onChange={(e) => setPagoForm({ ...pagoForm, notas: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closePagoModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={registrarPagoMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {registrarPagoMutation.isPending ? 'Guardando...' : 'Registrar pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
