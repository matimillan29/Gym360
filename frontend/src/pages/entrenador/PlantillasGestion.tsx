import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Plantilla {
  id: number;
  nombre: string;
  descripcion: string | null;
  estructura: {
    objetivo_general: string;
    mesociclos: Array<{
      nombre: string;
      objetivo: string;
      tipo: string;
      microciclos: Array<{
        numero: number;
        tipo: string;
        sesiones: Array<{
          numero: number;
          logica_entrenamiento: string;
          ejercicios_count: number;
        }>;
      }>;
    }>;
  };
  created_by: {
    id: number;
    nombre: string;
    apellido: string;
  };
  created_at: string;
  usos_count: number;
}

interface Entrenado {
  id: number;
  nombre: string;
  apellido: string;
  foto: string | null;
}

const tipoMesocicloLabels: Record<string, { label: string; color: string }> = {
  introductorio: { label: 'Introductorio', color: 'bg-blue-100 text-blue-800' },
  desarrollador: { label: 'Desarrollador', color: 'bg-green-100 text-green-800' },
  estabilizador: { label: 'Estabilizador', color: 'bg-yellow-100 text-yellow-800' },
  recuperacion: { label: 'Recuperación', color: 'bg-purple-100 text-purple-800' },
};

export default function PlantillasGestion() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [expandedPlantilla, setExpandedPlantilla] = useState<number | null>(null);
  const [showAplicarModal, setShowAplicarModal] = useState(false);
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null);
  const [selectedEntrenado, setSelectedEntrenado] = useState<string>('');
  const [nuevaPlantilla, setNuevaPlantilla] = useState({ nombre: '', descripcion: '' });

  const { data: plantillas, isLoading } = useQuery({
    queryKey: ['plantillas'],
    queryFn: async () => {
      const response = await api.get('/plantillas');
      return response.data.data as Plantilla[];
    },
  });

  const { data: entrenados } = useQuery({
    queryKey: ['entrenados-list'],
    queryFn: async () => {
      const response = await api.get('/entrenados?limit=100&estado=activo');
      return response.data.data as Entrenado[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/plantillas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
    },
  });

  const crearMutation = useMutation({
    mutationFn: async (data: { nombre: string; descripcion: string }) => {
      const response = await api.post('/plantillas', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
      setShowCrearModal(false);
      setNuevaPlantilla({ nombre: '', descripcion: '' });
      // La plantilla se crea vacía, mostrar mensaje informativo
      alert('Plantilla creada. Para agregar contenido, primero creá un plan de entrenamiento y luego guardalo como plantilla usando el botón "Guardar como Plantilla" en el editor de planes.');
    },
  });

  const aplicarMutation = useMutation({
    mutationFn: async ({ plantillaId, entrenadoId }: { plantillaId: number; entrenadoId: number }) => {
      const response = await api.post(`/plantillas/${plantillaId}/aplicar/${entrenadoId}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
      queryClient.invalidateQueries({ queryKey: ['planes'] });
      setShowAplicarModal(false);
      setSelectedPlantilla(null);
      setSelectedEntrenado('');
      const planId = data.data?.id || data.id;
      if (planId) {
        navigate(`/entrenador/planes/${planId}`);
      }
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Error al aplicar la plantilla';
      alert(message);
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar esta plantilla? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id);
    }
  };

  const openAplicarModal = (plantilla: Plantilla) => {
    // Verificar que la plantilla tenga contenido
    if (!plantilla.estructura.mesociclos || plantilla.estructura.mesociclos.length === 0) {
      alert('Esta plantilla está vacía (no tiene mesociclos). Para agregar contenido, primero creá un plan de entrenamiento y luego guardalo como plantilla usando el botón "Guardar como Plantilla" en el editor de planes.');
      return;
    }
    setSelectedPlantilla(plantilla);
    setSelectedEntrenado('');
    setShowAplicarModal(true);
  };

  const handleAplicar = () => {
    if (selectedPlantilla && selectedEntrenado) {
      aplicarMutation.mutate({
        plantillaId: selectedPlantilla.id,
        entrenadoId: parseInt(selectedEntrenado),
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const toggleExpanded = (id: number) => {
    setExpandedPlantilla(expandedPlantilla === id ? null : id);
  };

  // Filtrar por búsqueda
  const plantillasFiltradas = plantillas?.filter((p) => {
    if (!busqueda) return true;
    const search = busqueda.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(search) ||
      p.descripcion?.toLowerCase().includes(search) ||
      p.estructura.objetivo_general.toLowerCase().includes(search)
    );
  });

  // Calcular estadísticas
  const totalPlantillas = plantillas?.length || 0;
  const totalMesociclos = plantillas?.reduce(
    (acc, p) => acc + p.estructura.mesociclos.length,
    0
  ) || 0;
  const totalSesiones = plantillas?.reduce(
    (acc, p) =>
      acc +
      p.estructura.mesociclos.reduce(
        (macc, m) => macc + m.microciclos.reduce((miacc, mi) => miacc + mi.sesiones.length, 0),
        0
      ),
    0
  ) || 0;
  const totalUsos = plantillas?.reduce((acc, p) => acc + p.usos_count, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Planes</h1>
          <p className="text-gray-600">Plantillas reutilizables para crear planes</p>
        </div>
        <button
          onClick={() => setShowCrearModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Plantilla
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalPlantillas}</p>
              <p className="text-sm text-gray-500">Plantillas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalMesociclos}</p>
              <p className="text-sm text-gray-500">Mesociclos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalSesiones}</p>
              <p className="text-sm text-gray-500">Sesiones</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalUsos}</p>
              <p className="text-sm text-gray-500">Veces usadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar plantillas..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de plantillas */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">Cargando plantillas...</p>
        </div>
      ) : !plantillasFiltradas || plantillasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mb-2">No hay plantillas disponibles</p>
          <p className="text-sm text-gray-400">
            Podés crear una plantilla desde cualquier plan existente en el editor de planes
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {plantillasFiltradas.map((plantilla) => {
            const isExpanded = expandedPlantilla === plantilla.id;
            const totalMicros = plantilla.estructura.mesociclos.reduce(
              (acc, m) => acc + m.microciclos.length,
              0
            );
            const totalSes = plantilla.estructura.mesociclos.reduce(
              (acc, m) => acc + m.microciclos.reduce((macc, mi) => macc + mi.sesiones.length, 0),
              0
            );

            return (
              <div
                key={plantilla.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {plantilla.nombre}
                        </h3>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {plantilla.usos_count} uso{plantilla.usos_count !== 1 && 's'}
                        </span>
                      </div>
                      {plantilla.descripcion && (
                        <p className="text-gray-600 mb-2">{plantilla.descripcion}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Objetivo:</span>{' '}
                        {plantilla.estructura.objetivo_general}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          {plantilla.estructura.mesociclos.length} mesociclo{plantilla.estructura.mesociclos.length !== 1 && 's'}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {totalMicros} microciclo{totalMicros !== 1 && 's'}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {totalSes} sesione{totalSes !== 1 && 's'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Creada el {formatDate(plantilla.created_at)} por {plantilla.created_by.nombre} {plantilla.created_by.apellido}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAplicarModal(plantilla)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Aplicar
                      </button>
                      <button
                        onClick={() => toggleExpanded(plantilla.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <svg
                          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(plantilla.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detalles expandidos */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">
                      Estructura del plan
                    </h4>
                    <div className="space-y-4">
                      {plantilla.estructura.mesociclos.map((meso, mesoIndex) => {
                        const tipoInfo = tipoMesocicloLabels[meso.tipo] || { label: meso.tipo, color: 'bg-gray-100 text-gray-800' };
                        return (
                          <div
                            key={mesoIndex}
                            className="bg-white rounded-lg border border-gray-200 p-4"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-sm font-medium text-gray-500">
                                Meso {mesoIndex + 1}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {meso.nombre}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tipoInfo.color}`}>
                                {tipoInfo.label}
                              </span>
                            </div>
                            {meso.objetivo && (
                              <p className="text-sm text-gray-600 mb-3">
                                {meso.objetivo}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {meso.microciclos.map((micro, microIndex) => (
                                <div
                                  key={microIndex}
                                  className="px-3 py-2 bg-gray-100 rounded-lg text-sm"
                                >
                                  <span className="font-medium text-gray-700">
                                    Semana {micro.numero}
                                  </span>
                                  <span className="text-gray-500 ml-2">
                                    ({micro.sesiones.length} sesiones)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal aplicar plantilla */}
      {showAplicarModal && selectedPlantilla && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Aplicar Plantilla
              </h2>
              <button
                onClick={() => setShowAplicarModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900">{selectedPlantilla.nombre}</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {selectedPlantilla.estructura.mesociclos.length} mesociclos •{' '}
                  {selectedPlantilla.estructura.objetivo_general}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar entrenado *
                </label>
                <select
                  value={selectedEntrenado}
                  onChange={(e) => setSelectedEntrenado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Elegir entrenado</option>
                  {entrenados?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre} {e.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-sm text-gray-500">
                Se creará un nuevo plan basado en esta plantilla para el entrenado seleccionado.
              </p>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAplicarModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAplicar}
                  disabled={!selectedEntrenado || aplicarMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {aplicarMutation.isPending ? 'Aplicando...' : 'Aplicar plantilla'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear plantilla */}
      {showCrearModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Nueva Plantilla
              </h2>
              <button
                onClick={() => setShowCrearModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (nuevaPlantilla.nombre.trim()) {
                  crearMutation.mutate(nuevaPlantilla);
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la plantilla *
                </label>
                <input
                  type="text"
                  value={nuevaPlantilla.nombre}
                  onChange={(e) => setNuevaPlantilla({ ...nuevaPlantilla, nombre: e.target.value })}
                  placeholder="Ej: Hipertrofia principiantes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={nuevaPlantilla.descripcion}
                  onChange={(e) => setNuevaPlantilla({ ...nuevaPlantilla, descripcion: e.target.value })}
                  placeholder="Describe brevemente para qué tipo de entrenado es esta plantilla..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <p className="text-sm text-gray-500">
                Se creará una plantilla vacía que podrás editar agregando mesociclos, microciclos y ejercicios.
              </p>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCrearModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!nuevaPlantilla.nombre.trim() || crearMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {crearMutation.isPending ? 'Creando...' : 'Crear plantilla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
