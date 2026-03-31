<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plantilla;
use App\Models\Macrociclo;
use App\Models\User;
use Illuminate\Http\Request;

class PlantillaController extends Controller
{
    /**
     * Listar todas las plantillas
     */
    public function index()
    {
        $plantillas = Plantilla::with('createdBy:id,nombre,apellido')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $plantillas,
        ]);
    }

    /**
     * Crear plantilla desde un plan existente o desde cero
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'macrociclo_id' => 'nullable|exists:macrociclos,id',
            'estructura' => 'nullable|array',
        ]);

        // Si viene macrociclo_id, verificar que el entrenador tenga acceso
        if ($request->macrociclo_id) {
            $macrociclo = Macrociclo::with('entrenado')->findOrFail($request->macrociclo_id);
            $user = auth()->user();
            if (!$user->isAdmin() && $macrociclo->entrenado && $macrociclo->entrenado->entrenador_asignado_id !== $user->id) {
                return response()->json(['message' => 'No autorizado.'], 403);
            }
        }

        // Si no hay macrociclo_id ni estructura, crear plantilla vacía
        if (!$request->macrociclo_id && !$request->estructura) {
            $plantilla = Plantilla::create([
                'nombre' => $request->nombre,
                'descripcion' => $request->descripcion,
                'estructura' => [
                    'objetivo_general' => '',
                    'mesociclos' => [],
                ],
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'data' => $plantilla->load('createdBy:id,nombre,apellido'),
                'message' => 'Plantilla creada correctamente.',
            ], 201);
        }

        // Si viene estructura directamente, usarla
        if ($request->estructura) {
            $plantilla = Plantilla::create([
                'nombre' => $request->nombre,
                'descripcion' => $request->descripcion,
                'estructura' => $request->estructura,
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'data' => $plantilla->load('createdBy:id,nombre,apellido'),
                'message' => 'Plantilla creada correctamente.',
            ], 201);
        }

        // Obtener el macrociclo con toda su estructura (ya validado arriba)
        if (!isset($macrociclo)) {
            $macrociclo = Macrociclo::with([
                'mesociclos.microciclos.sesiones.ejercicios.ejercicio',
            ])->findOrFail($request->macrociclo_id);
        } else {
            $macrociclo->load('mesociclos.microciclos.sesiones.ejercicios.ejercicio');
        }

        // Crear la estructura de la plantilla (sin IDs ni entrenado)
        $estructura = [
            'objetivo_general' => $macrociclo->objetivo_general,
            'mesociclos' => $macrociclo->mesociclos->map(function ($mesociclo) {
                return [
                    'numero' => $mesociclo->numero,
                    'nombre' => $mesociclo->nombre,
                    'objetivo' => $mesociclo->objetivo,
                    'tipo' => $mesociclo->tipo,
                    'microciclos' => $mesociclo->microciclos->map(function ($microciclo) {
                        return [
                            'numero' => $microciclo->numero,
                            'tipo' => $microciclo->tipo,
                            'sesiones' => $microciclo->sesiones->map(function ($sesion) {
                                return [
                                    'numero' => $sesion->numero,
                                    'logica_entrenamiento' => $sesion->logica_entrenamiento,
                                    'observaciones' => $sesion->observaciones,
                                    'ejercicios' => $sesion->ejercicios->map(function ($ejercicio) {
                                        return [
                                            'ejercicio_id' => $ejercicio->ejercicio_id,
                                            'orden' => $ejercicio->orden,
                                            'etapa' => $ejercicio->etapa,
                                            'series' => $ejercicio->series,
                                            'repeticiones' => $ejercicio->repeticiones,
                                            'tiempo' => $ejercicio->tiempo,
                                            'intensidad_tipo' => $ejercicio->intensidad_tipo,
                                            'intensidad_valor' => $ejercicio->intensidad_valor,
                                            'descanso' => $ejercicio->descanso,
                                            'observaciones' => $ejercicio->observaciones,
                                        ];
                                    })->toArray(),
                                ];
                            })->toArray(),
                        ];
                    })->toArray(),
                ];
            })->toArray(),
        ];

        $plantilla = Plantilla::create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'estructura' => $estructura,
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'data' => $plantilla->load('createdBy:id,nombre,apellido'),
            'message' => 'Plantilla creada correctamente.',
        ], 201);
    }

    /**
     * Ver plantilla
     */
    public function show(Plantilla $plantilla)
    {
        return response()->json([
            'data' => $plantilla->load('createdBy:id,nombre,apellido'),
        ]);
    }

    /**
     * Actualizar plantilla
     */
    public function update(Request $request, Plantilla $plantilla)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && $plantilla->created_by !== $user->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'estructura' => 'nullable|array',
        ]);

        $plantilla->update($request->only(['nombre', 'descripcion', 'estructura']));

        return response()->json([
            'data' => $plantilla->load('createdBy:id,nombre,apellido'),
            'message' => 'Plantilla actualizada correctamente.',
        ]);
    }

    /**
     * Eliminar plantilla
     */
    public function destroy(Plantilla $plantilla)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && $plantilla->created_by !== $user->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $plantilla->delete();

        return response()->json([
            'message' => 'Plantilla eliminada correctamente.',
        ]);
    }

    /**
     * Aplicar plantilla a un entrenado (crear nuevo macrociclo)
     */
    public function aplicar(Plantilla $plantilla, $entrenadoId)
    {
        // Verificar que el entrenado pertenece al entrenador
        $entrenado = User::findOrFail($entrenadoId);
        $user = auth()->user();
        if (!$user->isAdmin() && $entrenado->entrenador_asignado_id !== $user->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $estructura = $plantilla->estructura;

        // Validar que la plantilla tenga contenido
        if (empty($estructura['mesociclos']) || count($estructura['mesociclos']) === 0) {
            return response()->json([
                'message' => 'Esta plantilla está vacía (no tiene mesociclos). Primero creá un plan de entrenamiento y guardalo como plantilla.',
            ], 422);
        }

        // Crear el macrociclo
        $macrociclo = Macrociclo::create([
            'entrenado_id' => $entrenadoId,
            'nombre' => $plantilla->nombre,
            'fecha_inicio' => now()->format('Y-m-d'),
            'objetivo_general' => $estructura['objetivo_general'] ?? '',
            'activo' => true,
        ]);

        // Crear mesociclos, microciclos, sesiones y ejercicios
        foreach ($estructura['mesociclos'] ?? [] as $mesoData) {
            $mesociclo = $macrociclo->mesociclos()->create([
                'numero' => $mesoData['numero'],
                'nombre' => $mesoData['nombre'],
                'objetivo' => $mesoData['objetivo'] ?? null,
                'tipo' => $mesoData['tipo'],
                'desbloqueado' => $mesoData['numero'] === 1,
            ]);

            foreach ($mesoData['microciclos'] ?? [] as $microData) {
                $microciclo = $mesociclo->microciclos()->create([
                    'numero' => $microData['numero'],
                    'tipo' => $microData['tipo'],
                ]);

                foreach ($microData['sesiones'] ?? [] as $sesionData) {
                    $sesion = $microciclo->sesiones()->create([
                        'numero' => $sesionData['numero'],
                        'logica_entrenamiento' => $sesionData['logica_entrenamiento'] ?? null,
                        'observaciones' => $sesionData['observaciones'] ?? null,
                    ]);

                    foreach ($sesionData['ejercicios'] ?? [] as $ejercicioData) {
                        $sesion->ejercicios()->create([
                            'ejercicio_id' => $ejercicioData['ejercicio_id'],
                            'orden' => $ejercicioData['orden'],
                            'etapa' => $ejercicioData['etapa'],
                            'series' => $ejercicioData['series'],
                            'repeticiones' => $ejercicioData['repeticiones'] ?? null,
                            'tiempo' => $ejercicioData['tiempo'] ?? null,
                            'intensidad_tipo' => $ejercicioData['intensidad_tipo'],
                            'intensidad_valor' => $ejercicioData['intensidad_valor'],
                            'descanso' => $ejercicioData['descanso'],
                            'observaciones' => $ejercicioData['observaciones'] ?? null,
                        ]);
                    }
                }
            }
        }

        return response()->json([
            'data' => $macrociclo->load(['entrenado:id,nombre,apellido', 'mesociclos']),
            'message' => 'Plantilla aplicada correctamente.',
        ], 201);
    }
}
