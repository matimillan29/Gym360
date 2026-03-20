import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { Ejercicio } from '../../types';

const ETAPAS = [
  'Movilidad',
  'Calentamiento',
  'Activación',
  'Zona media / Core',
  'Principal',
  'Accesorios',
  'Enfriamiento / Vuelta a la calma'
];

const CATEGORIAS_ZONA = [
  'Miembro superior',
  'Miembro inferior',
  'Core / Zona media',
  'Cuerpo completo'
];

const PATRONES_MOVIMIENTO = [
  'Empuje horizontal',
  'Empuje vertical',
  'Tirón horizontal',
  'Tirón vertical',
  'Dominante de rodilla',
  'Dominante de cadera',
  'Cargadas',
  'Acarreos',
  'Rotación / Anti-rotación',
  'Cardio / Metabólico'
];

const GRUPOS_MUSCULARES = [
  'Pectorales', 'Dorsales', 'Deltoides', 'Trapecios', 'Bíceps', 'Tríceps',
  'Antebrazos', 'Abdominales', 'Oblicuos', 'Lumbares', 'Glúteos',
  'Cuádriceps', 'Isquiotibiales', 'Aductores', 'Abductores', 'Gemelos'
];

export default function EjerciciosList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedEtapa, setSelectedEtapa] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedPatron, setSelectedPatron] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEjercicio, setEditingEjercicio] = useState<Ejercicio | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    video_url: '',
    etapas: [] as string[],
    categorias_zona: [] as string[],
    patrones_movimiento: [] as string[],
    grupos_musculares: [] as string[],
    es_global: true
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ejercicios', search, selectedEtapa, selectedCategoria, selectedPatron],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedEtapa) params.append('etapa', selectedEtapa);
      if (selectedCategoria) params.append('categoria', selectedCategoria);
      if (selectedPatron) params.append('patron', selectedPatron);

      const response = await api.get(`/ejercicios?${params.toString()}`);
      return response.data.data || response.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editingEjercicio) {
        return api.put(`/ejercicios/${editingEjercicio.id}`, data);
      } else {
        return api.post('/ejercicios', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      closeModal();
      toast.success(editingEjercicio ? 'Ejercicio actualizado correctamente' : 'Ejercicio creado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (editingEjercicio ? 'Error al actualizar el ejercicio' : 'Error al crear el ejercicio');
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/ejercicios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      toast.success('Ejercicio eliminado correctamente');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al eliminar el ejercicio';
      toast.error(msg);
    },
  });

  const ejercicios: Ejercicio[] = data || [];
  const hasActiveFilters = selectedEtapa || selectedCategoria || selectedPatron;

  const clearFilters = () => {
    setSelectedEtapa(null);
    setSelectedCategoria(null);
    setSelectedPatron(null);
  };

  const openModal = (ejercicio?: Ejercicio) => {
    if (ejercicio) {
      setEditingEjercicio(ejercicio);
      setForm({
        nombre: ejercicio.nombre,
        descripcion: ejercicio.descripcion || '',
        video_url: ejercicio.video_url || '',
        etapas: ejercicio.etapas || [],
        categorias_zona: ejercicio.categorias_zona || [],
        patrones_movimiento: ejercicio.patrones_movimiento || [],
        grupos_musculares: ejercicio.grupos_musculares || [],
        es_global: ejercicio.es_global
      });
    } else {
      setEditingEjercicio(null);
      setForm({
        nombre: '',
        descripcion: '',
        video_url: '',
        etapas: [],
        categorias_zona: [],
        patrones_movimiento: [],
        grupos_musculares: [],
        es_global: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEjercicio(null);
  };

  const toggleArrayValue = (field: 'etapas' | 'categorias_zona' | 'patrones_movimiento' | 'grupos_musculares', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Biblioteca de Ejercicios</h1>
            <p className="text-indigo-100 mt-1">
              {ejercicios.length} ejercicios disponibles
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo ejercicio
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar ejercicios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              hasActiveFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
            {hasActiveFilters && (
              <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">
                {[selectedEtapa, selectedCategoria, selectedPatron].filter(Boolean).length}
              </span>
            )}
            <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
                <select
                  value={selectedEtapa || ''}
                  onChange={(e) => setSelectedEtapa(e.target.value || null)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todas</option>
                  {ETAPAS.map(etapa => (
                    <option key={etapa} value={etapa}>{etapa}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={selectedCategoria || ''}
                  onChange={(e) => setSelectedCategoria(e.target.value || null)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todas</option>
                  {CATEGORIAS_ZONA.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patrón de movimiento</label>
                <select
                  value={selectedPatron || ''}
                  onChange={(e) => setSelectedPatron(e.target.value || null)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todos</option>
                  {PATRONES_MOVIMIENTO.map(patron => (
                    <option key={patron} value={patron}>{patron}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Cargando ejercicios...</p>
          </div>
        ) : ejercicios.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
            </svg>
            <p className="text-gray-500">No se encontraron ejercicios</p>
            {(search || hasActiveFilters) && (
              <button
                onClick={() => {
                  setSearch('');
                  clearFilters();
                }}
                className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ejercicios.map((ejercicio) => (
              <div key={ejercicio.id} className="hover:bg-gray-50 transition-colors">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === ejercicio.id ? null : ejercicio.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      {ejercicio.video_url ? (
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-gray-900">{ejercicio.nombre}</h3>
                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === ejercicio.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {/* Tags */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ejercicio.etapas?.slice(0, 2).map((etapa) => (
                          <span key={etapa} className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                            {etapa}
                          </span>
                        ))}
                        {ejercicio.grupos_musculares?.slice(0, 3).map((grupo) => (
                          <span key={grupo} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            {grupo}
                          </span>
                        ))}
                        {(ejercicio.grupos_musculares?.length || 0) > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                            +{ejercicio.grupos_musculares.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {expandedId === ejercicio.id && (
                  <div className="px-4 pb-4 border-t bg-gray-50">
                    <div className="pt-4 space-y-4">
                      {ejercicio.descripcion && (
                        <div>
                          <p className="text-sm text-gray-600">{ejercicio.descripcion}</p>
                        </div>
                      )}

                      {ejercicio.video_url && (
                        <div className="aspect-video max-w-md rounded-lg overflow-hidden bg-black">
                          {extractYoutubeId(ejercicio.video_url) ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${extractYoutubeId(ejercicio.video_url)}`}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <a
                              href={ejercicio.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center h-full text-white hover:text-indigo-300"
                            >
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </a>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {ejercicio.etapas?.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Etapas</p>
                            <div className="flex flex-wrap gap-1">
                              {ejercicio.etapas.map(e => (
                                <span key={e} className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">{e}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {ejercicio.categorias_zona?.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Zona</p>
                            <div className="flex flex-wrap gap-1">
                              {ejercicio.categorias_zona.map(c => (
                                <span key={c} className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {ejercicio.patrones_movimiento?.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Patrones</p>
                            <div className="flex flex-wrap gap-1">
                              {ejercicio.patrones_movimiento.map(p => (
                                <span key={p} className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">{p}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {ejercicio.grupos_musculares?.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Músculos</p>
                            <div className="flex flex-wrap gap-1">
                              {ejercicio.grupos_musculares.map(g => (
                                <span key={g} className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700">{g}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(ejercicio);
                          }}
                          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Editar
                        </button>
                        {!ejercicio.es_global && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('¿Eliminar este ejercicio?')) {
                                deleteMutation.mutate(ejercicio.id);
                              }
                            }}
                            className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {editingEjercicio ? 'Editar ejercicio' : 'Nuevo ejercicio'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link de video (YouTube)</label>
                <input
                  type="url"
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etapas de entrenamiento</label>
                <div className="flex flex-wrap gap-2">
                  {ETAPAS.map(etapa => (
                    <button
                      key={etapa}
                      type="button"
                      onClick={() => toggleArrayValue('etapas', etapa)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        form.etapas.includes(etapa)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {etapa}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría por zona</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS_ZONA.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleArrayValue('categorias_zona', cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        form.categorias_zona.includes(cat)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patrones de movimiento</label>
                <div className="flex flex-wrap gap-2">
                  {PATRONES_MOVIMIENTO.map(patron => (
                    <button
                      key={patron}
                      type="button"
                      onClick={() => toggleArrayValue('patrones_movimiento', patron)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        form.patrones_movimiento.includes(patron)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {patron}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grupos musculares</label>
                <div className="flex flex-wrap gap-2">
                  {GRUPOS_MUSCULARES.map(grupo => (
                    <button
                      key={grupo}
                      type="button"
                      onClick={() => toggleArrayValue('grupos_musculares', grupo)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        form.grupos_musculares.includes(grupo)
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {grupo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="es_global"
                  checked={form.es_global}
                  onChange={(e) => setForm({ ...form, es_global: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="es_global" className="text-sm text-gray-600">
                  Ejercicio global (disponible para todos los entrenadores)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
