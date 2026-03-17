import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

interface Macrociclo {
  id: number;
  nombre?: string;
  tipo_plan?: 'simple' | 'complejo';
  entrenado: {
    id: number;
    nombre: string;
    apellido: string;
    plan_complejo?: boolean;
  };
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  objetivo_general: string;
  activo: boolean;
  mesociclos_count?: number;
  created_at: string;
}

interface Plantilla {
  id: number;
  nombre: string;
  descripcion?: string;
  created_by: {
    nombre: string;
    apellido: string;
  };
  created_at: string;
}

export default function PlanesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'planes' | 'plantillas'>('planes');
  const [search, setSearch] = useState('');
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [selectedEntrenado, setSelectedEntrenado] = useState<number | ''>('');
  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [entrenadoSearch, setEntrenadoSearch] = useState('');

  // Fetch planes (macrociclos)
  const { data: planes = [], isLoading: isLoadingPlanes } = useQuery<Macrociclo[]>({
    queryKey: ['planes'],
    queryFn: async () => {
      const response = await api.get('/macrociclos');
      return response.data.data || response.data || [];
    },
  });

  // Fetch plantillas
  const { data: plantillas = [], isLoading: isLoadingPlantillas } = useQuery<Plantilla[]>({
    queryKey: ['plantillas'],
    queryFn: async () => {
      const response = await api.get('/plantillas');
      return response.data.data || response.data || [];
    },
    enabled: activeTab === 'plantillas',
  });

  // Fetch entrenados para el modal
  const { data: entrenados = [] } = useQuery({
    queryKey: ['entrenados-select'],
    queryFn: async () => {
      const response = await api.get('/entrenados?estado=activo');
      return response.data.data || response.data || [];
    },
    enabled: showNewPlanModal,
  });

  // Mutation para eliminar plan
  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/macrociclos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planes'] });
    },
  });

  // Mutation para eliminar plantilla
  const deletePlantillaMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/plantillas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantillas'] });
    },
  });

  // Mutation para aplicar plantilla
  const aplicarPlantillaMutation = useMutation({
    mutationFn: async ({ plantillaId, entrenadoId }: { plantillaId: number; entrenadoId: number }) => {
      const response = await api.post(`/plantillas/${plantillaId}/aplicar/${entrenadoId}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['planes'] });
      // Navegar al nuevo plan creado
      const planId = data.data?.id || data.id;
      if (planId) {
        navigate(`/entrenador/planes/${planId}`);
      }
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || 'Error al aplicar la plantilla';
      alert(message);
      setIsApplying(false);
    },
  });

  const filteredPlanes = planes.filter((plan) => {
    const searchLower = search.toLowerCase();
    return (
      plan.entrenado?.nombre?.toLowerCase().includes(searchLower) ||
      plan.entrenado?.apellido?.toLowerCase().includes(searchLower) ||
      plan.objetivo_general?.toLowerCase().includes(searchLower)
    );
  });

  const filteredPlantillas = plantillas.filter((plantilla) => {
    const searchLower = search.toLowerCase();
    return (
      plantilla.nombre.toLowerCase().includes(searchLower) ||
      plantilla.descripcion?.toLowerCase().includes(searchLower)
    );
  });

  const handleCreatePlan = async () => {
    if (!selectedEntrenado) return;

    if (selectedPlantilla) {
      // Aplicar plantilla
      setIsApplying(true);
      try {
        await aplicarPlantillaMutation.mutateAsync({
          plantillaId: selectedPlantilla.id,
          entrenadoId: selectedEntrenado as number,
        });
      } catch (error) {
        console.error('Error al aplicar plantilla:', error);
        setIsApplying(false);
      }
    } else {
      // Crear plan desde cero - determinar tipo segun entrenado
      const entrenadoData = entrenados.find((e: { id: number; plan_complejo?: boolean }) => e.id === selectedEntrenado);
      if (entrenadoData?.plan_complejo) {
        navigate(`/entrenador/planes/nuevo?entrenado=${selectedEntrenado}`);
      } else {
        navigate(`/entrenador/planes/simple/nuevo?entrenado=${selectedEntrenado}`);
      }
    }
    setShowNewPlanModal(false);
    setSelectedPlantilla(null);
    setSelectedEntrenado('');
  };

  const closeModal = () => {
    setShowNewPlanModal(false);
    setSelectedPlantilla(null);
    setSelectedEntrenado('');
    setIsApplying(false);
    setEntrenadoSearch('');
  };

  // Filter entrenados by search
  const filteredEntrenados = entrenados.filter((e: { nombre: string; apellido: string }) => {
    const searchLower = entrenadoSearch.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(searchLower) ||
      e.apellido.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-purple-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Planes de Entrenamiento</h1>
            <p className="text-purple-100 mt-1">Gestión de macrociclos y plantillas</p>
          </div>
          <button
            onClick={() => setShowNewPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('planes')}
          className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'planes'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Planes Activos
        </button>
        <button
          onClick={() => setActiveTab('plantillas')}
          className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'plantillas'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Plantillas
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder={activeTab === 'planes' ? 'Buscar por entrenado u objetivo...' : 'Buscar plantilla...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Content */}
      {activeTab === 'planes' ? (
        isLoadingPlanes ? (
          <div className="flex justify-center py-12">
            <p className="text-gray-500">Cargando planes...</p>
          </div>
        ) : filteredPlanes.length > 0 ? (
          <div className="grid gap-4">
            {filteredPlanes.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                      {plan.entrenado?.nombre?.[0]}{plan.entrenado?.apellido?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {plan.entrenado?.nombre} {plan.entrenado?.apellido}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          plan.tipo_plan === 'simple'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {plan.tipo_plan === 'simple' ? 'Simple' : 'Complejo'}
                        </span>
                      </div>
                      {plan.nombre && (
                        <p className="text-sm font-medium text-gray-700 mt-0.5">{plan.nombre}</p>
                      )}
                      <p className="text-gray-600 mt-1">{plan.objetivo_general}</p>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Inicio: {new Date(plan.fecha_inicio).toLocaleDateString('es-AR')}
                        </span>
                        {plan.fecha_fin_estimada && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Fin: {new Date(plan.fecha_fin_estimada).toLocaleDateString('es-AR')}
                          </span>
                        )}
                        {plan.mesociclos_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            {plan.mesociclos_count} mesociclos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      plan.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {plan.activo ? 'Activo' : 'Finalizado'}
                    </span>
                    <div className="relative group">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => navigate(
                            plan.tipo_plan === 'simple'
                              ? `/entrenador/planes/simple/${plan.id}`
                              : `/entrenador/planes/${plan.id}`
                          )}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar plan
                        </button>
                        <button
                          onClick={() => navigate(`/entrenador/entrenados/${plan.entrenado?.id}`)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Ver entrenado
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            if (confirm('¿Estás seguro de eliminar este plan?')) {
                              deletePlanMutation.mutate(plan.id);
                            }
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay planes creados</h3>
            <p className="text-gray-500 mb-4">Creá tu primer plan de entrenamiento</p>
            <button
              onClick={() => setShowNewPlanModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Crear nuevo plan
            </button>
          </div>
        )
      ) : (
        // Plantillas tab
        isLoadingPlantillas ? (
          <div className="flex justify-center py-12">
            <p className="text-gray-500">Cargando plantillas...</p>
          </div>
        ) : filteredPlantillas.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlantillas.map((plantilla) => (
              <div
                key={plantilla.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar esta plantilla?')) {
                        deletePlantillaMutation.mutate(plantilla.id);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{plantilla.nombre}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {plantilla.descripcion || 'Sin descripción'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-xs text-gray-400">
                    Por {plantilla.created_by?.nombre} {plantilla.created_by?.apellido}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPlantilla(plantilla);
                      setShowNewPlanModal(true);
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Usar plantilla
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay plantillas</h3>
            <p className="text-gray-500">Las plantillas se crean al guardar un plan como plantilla</p>
          </div>
        )
      )}

      {/* Modal nuevo plan */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedPlantilla ? 'Aplicar Plantilla' : 'Nuevo Plan de Entrenamiento'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedPlantilla
                  ? `Crear plan basado en "${selectedPlantilla.nombre}"`
                  : 'Seleccioná un entrenado para crear su plan'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Info de plantilla seleccionada */}
              {selectedPlantilla && (
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-purple-900">{selectedPlantilla.nombre}</p>
                    {selectedPlantilla.descripcion && (
                      <p className="text-sm text-purple-700 mt-0.5 line-clamp-2">{selectedPlantilla.descripcion}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedPlantilla(null)}
                    className="p-1 text-purple-400 hover:text-purple-600 transition-colors"
                    title="Quitar plantilla"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Selector de entrenado con búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entrenado
                </label>
                <div className="relative mb-2">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar entrenado..."
                    value={entrenadoSearch}
                    onChange={(e) => setEntrenadoSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    disabled={isApplying}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredEntrenados.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500 text-center">No se encontraron entrenados</p>
                  ) : (
                    filteredEntrenados.map((entrenado: { id: number; nombre: string; apellido: string }) => (
                      <button
                        key={entrenado.id}
                        type="button"
                        onClick={() => setSelectedEntrenado(entrenado.id)}
                        disabled={isApplying}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-purple-50 transition-colors flex items-center gap-2 ${
                          selectedEntrenado === entrenado.id ? 'bg-purple-100 text-purple-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium text-xs">
                          {entrenado.nombre[0]}{entrenado.apellido[0]}
                        </div>
                        <span>{entrenado.nombre} {entrenado.apellido}</span>
                        {selectedEntrenado === entrenado.id && (
                          <svg className="w-4 h-4 ml-auto text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={isApplying}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={!selectedEntrenado || isApplying}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isApplying ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Aplicando...
                  </>
                ) : selectedPlantilla ? (
                  'Aplicar plantilla'
                ) : (
                  'Continuar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
