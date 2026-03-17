import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface AuditLog {
  id: number;
  user: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  } | null;
  user_type: 'admin' | 'entrenador' | 'entrenado';
  action: 'create' | 'update' | 'delete' | 'login' | 'logout';
  entity: string;
  entity_id: number | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

interface PaginatedResponse {
  data: AuditLog[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export default function Auditoria() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['audit', page, actionFilter, entityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity', entityFilter);

      const response = await api.get(`/audit?${params.toString()}`);
      return response.data;
    },
  });

  const logs = data?.data || [];
  const meta = data?.meta;

  const getActionBadge = (action: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      create: { bg: 'bg-green-100', text: 'text-green-800', label: 'Crear' },
      update: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Actualizar' },
      delete: { bg: 'bg-red-100', text: 'text-red-800', label: 'Eliminar' },
      login: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Login' },
      logout: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Logout' },
    };
    const c = config[action] || { bg: 'bg-gray-100', text: 'text-gray-800', label: action };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const getUserTypeBadge = (type: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      admin: { bg: 'bg-red-50', text: 'text-red-700' },
      entrenador: { bg: 'bg-blue-50', text: 'text-blue-700' },
      entrenado: { bg: 'bg-green-50', text: 'text-green-700' },
    };
    const c = config[type] || { bg: 'bg-gray-50', text: 'text-gray-700' };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
        {type}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatEntityName = (entity: string) => {
    const names: Record<string, string> = {
      entrenado: 'Entrenado',
      entrenador: 'Entrenador',
      macrociclo: 'Plan',
      mesociclo: 'Mesociclo',
      microciclo: 'Microciclo',
      sesion: 'Sesión',
      ejercicio: 'Ejercicio',
      cuota: 'Cuota',
      pago: 'Pago',
      evaluacion: 'Evaluación',
      anamnesis: 'Anamnesis',
      gym_config: 'Configuración',
      plan_cuota: 'Plan de Cuota',
    };
    return names[entity] || entity;
  };

  const renderJsonDiff = (oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) => {
    if (!oldData && !newData) return null;

    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {}),
    ]);

    // Filtrar campos internos
    const filteredKeys = Array.from(allKeys).filter(
      (key) => !['password', 'remember_token', 'created_at', 'updated_at'].includes(key)
    );

    if (filteredKeys.length === 0) {
      return <p className="text-gray-500 text-sm">Sin cambios relevantes</p>;
    }

    return (
      <div className="space-y-2">
        {filteredKeys.map((key) => {
          const oldVal = oldData?.[key];
          const newVal = newData?.[key];
          const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

          return (
            <div key={key} className={`text-sm ${changed ? 'bg-yellow-50 p-2 rounded' : ''}`}>
              <span className="font-medium text-gray-700">{key}:</span>
              {oldData && oldVal !== undefined && (
                <span className="ml-2 text-red-600 line-through">
                  {typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal)}
                </span>
              )}
              {newData && newVal !== undefined && (
                <span className="ml-2 text-green-600">
                  {typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-gray-800 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Auditoría</h1>
            <p className="text-gray-300 mt-1">Registro de actividades del sistema</p>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              <option value="">Todas las acciones</option>
              <option value="create">Crear</option>
              <option value="update">Actualizar</option>
              <option value="delete">Eliminar</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Entidad</label>
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              <option value="">Todas las entidades</option>
              <option value="entrenado">Entrenados</option>
              <option value="entrenador">Entrenadores</option>
              <option value="macrociclo">Planes</option>
              <option value="cuota">Cuotas</option>
              <option value="pago">Pagos</option>
              <option value="ejercicio">Ejercicios</option>
              <option value="evaluacion">Evaluaciones</option>
              <option value="gym_config">Configuración</option>
            </select>
          </div>

          {(actionFilter || entityFilter) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setActionFilter('');
                  setEntityFilter('');
                  setPage(1);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <p className="text-gray-500">Cargando registros...</p>
          </div>
        ) : logs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalles
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <>
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {log.user ? `${log.user.nombre} ${log.user.apellido}` : 'Sistema'}
                            </span>
                            <div className="mt-1">
                              {getUserTypeBadge(log.user_type)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{formatEntityName(log.entity)}</span>
                          {log.entity_id && (
                            <span className="text-sm text-gray-500 ml-1">#{log.entity_id}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ip || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(log.old_data || log.new_data) && (
                            <button
                              onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                              className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                            >
                              {expandedRow === log.id ? 'Ocultar' : 'Ver cambios'}
                              <svg
                                className={`w-4 h-4 transition-transform ${expandedRow === log.id ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedRow === log.id && (
                        <tr key={`${log.id}-detail`}>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="max-w-4xl">
                              {renderJsonDiff(log.old_data, log.new_data)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {meta && meta.last_page > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Mostrando {(meta.current_page - 1) * meta.per_page + 1} -{' '}
                  {Math.min(meta.current_page * meta.per_page, meta.total)} de {meta.total} registros
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    Página {meta.current_page} de {meta.last_page}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                    disabled={page === meta.last_page}
                    className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay registros</h3>
            <p className="text-gray-500">No se encontraron registros con los filtros seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
}
