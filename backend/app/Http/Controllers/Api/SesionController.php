<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Microciclo;
use App\Models\Sesion;
use App\Models\SesionEjercicio;
use App\Models\Ejercicio;
use App\Models\RegistroSesion;
use App\Models\RegistroEjercicio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SesionController extends Controller
{
    /**
     * Listar sesiones de un microciclo
     */
    public function index(Microciclo $microciclo)
    {
        $sesiones = $microciclo->sesiones()
            ->withCount('ejercicios')
            ->orderBy('numero')
            ->get();

        return response()->json([
            'data' => $sesiones,
        ]);
    }

    /**
     * Crear sesión
     */
    public function store(Request $request, Microciclo $microciclo)
    {
        $request->validate([
            'numero' => 'required|integer|min:1',
            'fecha_programada' => 'nullable|date',
            'logica_entrenamiento' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string',
        ]);

        // Verificar que no haya otra sesión con el mismo número
        $existente = $microciclo->sesiones()
            ->where('numero', $request->numero)
            ->exists();

        if ($existente) {
            return response()->json([
                'message' => 'Ya existe una sesión con ese número en este microciclo.',
            ], 400);
        }

        $sesion = Sesion::create([
            'microciclo_id' => $microciclo->id,
            'numero' => $request->numero,
            'fecha_programada' => $request->fecha_programada,
            'logica_entrenamiento' => $request->logica_entrenamiento,
            'observaciones' => $request->observaciones,
        ]);

        return response()->json([
            'data' => $sesion,
            'message' => 'Sesión creada correctamente.',
        ], 201);
    }

    /**
     * Ver sesión con ejercicios
     */
    public function show(Sesion $sesion)
    {
        $sesion->load([
            'ejercicios' => function ($q) {
                $q->orderBy('orden');
            },
            'ejercicios.ejercicio',
        ]);

        return response()->json([
            'data' => $sesion,
        ]);
    }

    /**
     * Actualizar sesión
     */
    public function update(Request $request, Sesion $sesion)
    {
        $request->validate([
            'numero' => 'sometimes|required|integer|min:1',
            'fecha_programada' => 'nullable|date',
            'logica_entrenamiento' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string',
        ]);

        // Verificar que no haya otra sesión con el mismo número
        if ($request->has('numero') && $request->numero !== $sesion->numero) {
            $existente = Sesion::where('microciclo_id', $sesion->microciclo_id)
                ->where('id', '!=', $sesion->id)
                ->where('numero', $request->numero)
                ->exists();

            if ($existente) {
                return response()->json([
                    'message' => 'Ya existe una sesión con ese número en este microciclo.',
                ], 400);
            }
        }

        $sesion->update($request->only([
            'numero',
            'fecha_programada',
            'logica_entrenamiento',
            'observaciones',
        ]));

        return response()->json([
            'data' => $sesion,
            'message' => 'Sesión actualizada correctamente.',
        ]);
    }

    /**
     * Eliminar sesión
     */
    public function destroy(Sesion $sesion)
    {
        $sesion->delete();

        return response()->json([
            'message' => 'Sesión eliminada correctamente.',
        ]);
    }

    /**
     * Agregar ejercicio a la sesión
     */
    public function agregarEjercicio(Request $request, Sesion $sesion)
    {
        $request->validate([
            'ejercicio_id' => 'required|exists:ejercicios,id',
            'orden' => 'required|integer|min:1',
            'etapa' => 'required|string|max:50',
            'series' => 'required|integer|min:1|max:20',
            'repeticiones' => 'nullable|integer|min:1',
            'tiempo' => 'nullable|integer|min:1',
            'intensidad_tipo' => 'nullable|in:rir,rpe,porcentaje',
            'intensidad_valor' => 'nullable|numeric',
            'descanso' => 'nullable|integer|min:0|max:600',
            'observaciones' => 'nullable|string',
            'superserie_con' => 'nullable|exists:sesion_ejercicios,id',
        ]);

        $sesionEjercicio = SesionEjercicio::create([
            'sesion_id' => $sesion->id,
            'ejercicio_id' => $request->ejercicio_id,
            'orden' => $request->orden,
            'etapa' => $request->etapa,
            'series' => $request->series,
            'repeticiones' => $request->repeticiones,
            'tiempo' => $request->tiempo,
            'intensidad_tipo' => $request->intensidad_tipo,
            'intensidad_valor' => $request->intensidad_valor,
            'descanso' => $request->descanso ?? 90,
            'observaciones' => $request->observaciones,
            'superserie_con' => $request->superserie_con,
        ]);

        $sesionEjercicio->load('ejercicio');

        return response()->json([
            'data' => $sesionEjercicio,
            'message' => 'Ejercicio agregado correctamente.',
        ], 201);
    }

    /**
     * Actualizar ejercicio de la sesión
     */
    public function actualizarEjercicio(Request $request, Sesion $sesion, SesionEjercicio $ejercicio)
    {
        if ($ejercicio->sesion_id !== $sesion->id) {
            return response()->json([
                'message' => 'El ejercicio no pertenece a esta sesión.',
            ], 400);
        }

        $request->validate([
            'ejercicio_id' => 'sometimes|required|exists:ejercicios,id',
            'orden' => 'sometimes|required|integer|min:1',
            'etapa' => 'sometimes|required|string|max:50',
            'series' => 'sometimes|required|integer|min:1|max:20',
            'repeticiones' => 'nullable|integer|min:1',
            'tiempo' => 'nullable|integer|min:1',
            'intensidad_tipo' => 'nullable|in:rir,rpe,porcentaje',
            'intensidad_valor' => 'nullable|numeric',
            'descanso' => 'nullable|integer|min:0|max:600',
            'observaciones' => 'nullable|string',
            'superserie_con' => 'nullable|exists:sesion_ejercicios,id',
        ]);

        $ejercicio->update($request->only([
            'ejercicio_id',
            'orden',
            'etapa',
            'series',
            'repeticiones',
            'tiempo',
            'intensidad_tipo',
            'intensidad_valor',
            'descanso',
            'observaciones',
            'superserie_con',
        ]));

        $ejercicio->load('ejercicio');

        return response()->json([
            'data' => $ejercicio,
            'message' => 'Ejercicio actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar ejercicio de la sesión
     */
    public function eliminarEjercicio(Sesion $sesion, SesionEjercicio $ejercicio)
    {
        if ($ejercicio->sesion_id !== $sesion->id) {
            return response()->json([
                'message' => 'El ejercicio no pertenece a esta sesión.',
            ], 400);
        }

        $orden = $ejercicio->orden;
        $ejercicio->delete();

        // Reordenar los restantes
        SesionEjercicio::where('sesion_id', $sesion->id)
            ->where('orden', '>', $orden)
            ->decrement('orden');

        return response()->json([
            'message' => 'Ejercicio eliminado correctamente.',
        ]);
    }

    /**
     * Reordenar ejercicios de la sesión
     */
    public function reordenarEjercicios(Request $request, Sesion $sesion)
    {
        $request->validate([
            'ejercicios' => 'required|array',
            'ejercicios.*' => 'integer|exists:sesion_ejercicios,id',
        ]);

        DB::transaction(function () use ($request, $sesion) {
            foreach ($request->ejercicios as $index => $ejercicioId) {
                SesionEjercicio::where('id', $ejercicioId)
                    ->where('sesion_id', $sesion->id)
                    ->update(['orden' => $index + 1]);
            }
        });

        return response()->json([
            'message' => 'Ejercicios reordenados correctamente.',
        ]);
    }

    // ===========================================
    // Métodos para entrenados
    // ===========================================

    /**
     * Ver sesión de hoy para el entrenado
     */
    public function miSesionHoy(Request $request)
    {
        $user = $request->user();

        // Obtener macrociclo activo
        $macrociclo = $user->macrociclos()
            ->where('activo', true)
            ->first();

        if (!$macrociclo) {
            return response()->json([
                'data' => null,
                'message' => 'No tenés un plan activo.',
            ]);
        }

        // Buscar sesión programada para hoy
        $sesion = Sesion::whereHas('microciclo.mesociclo', function ($q) use ($macrociclo) {
            $q->where('macrociclo_id', $macrociclo->id)
                ->where('desbloqueado', true);
        })
            ->whereDate('fecha_programada', Carbon::today())
            ->with([
                'ejercicios' => function ($q) {
                    $q->orderBy('orden');
                },
                'ejercicios.ejercicio',
                'microciclo',
            ])
            ->first();

        if (!$sesion) {
            return response()->json([
                'data' => null,
                'message' => 'No tenés sesión programada para hoy.',
            ]);
        }

        return response()->json([
            'data' => $sesion,
        ]);
    }

    /**
     * Historial de sesiones completadas del entrenado
     */
    public function miHistorial(Request $request)
    {
        $user = $request->user();
        $mes = $request->get('mes');

        $query = RegistroSesion::where('entrenado_id', $user->id)
            ->with([
                'sesion' => function ($q) {
                    $q->with(['microciclo.mesociclo']);
                },
                'registrosEjercicio' => function ($q) {
                    $q->with('sesionEjercicio.ejercicio');
                },
            ])
            ->orderByDesc('fecha');

        if ($mes) {
            $query->whereRaw("DATE_FORMAT(fecha, '%Y-%m') = ?", [$mes]);
        }

        $registros = $query->get();

        $data = $registros->map(function ($registro) {
            return [
                'id' => $registro->id,
                'sesion_numero' => $registro->sesion?->numero ?? 0,
                'fecha' => $registro->fecha->toISOString(),
                'estado' => $registro->estado,
                'feedback_general' => $registro->feedback_general,
                'microciclo_numero' => $registro->sesion?->microciclo?->numero ?? 0,
                'mesociclo_nombre' => $registro->sesion?->microciclo?->mesociclo?->nombre ?? '',
                'ejercicios' => $registro->registrosEjercicio->map(function ($regEj) {
                    return [
                        'id' => $regEj->id,
                        'ejercicio_nombre' => $regEj->sesionEjercicio?->ejercicio?->nombre ?? 'Ejercicio',
                        'peso' => $regEj->peso,
                        'repeticiones' => $regEj->repeticiones,
                        'series_completadas' => $regEj->series_completadas,
                        'intensidad_percibida' => $regEj->intensidad_percibida,
                        'completado' => $regEj->completado,
                    ];
                }),
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Iniciar sesión de entrenamiento
     */
    public function iniciarSesion(Request $request, Sesion $sesion)
    {
        $user = $request->user();

        // Verificar que la sesión pertenece al plan del usuario
        if (!$this->sesionPerteneceAUsuario($sesion, $user)) {
            return response()->json([
                'message' => 'Esta sesión no te pertenece.',
            ], 403);
        }

        // Verificar que no haya una sesión ya iniciada hoy
        $sesionExistente = RegistroSesion::where('entrenado_id', $user->id)
            ->where('sesion_id', $sesion->id)
            ->whereDate('fecha', Carbon::today())
            ->whereNull('hora_fin')
            ->first();

        if ($sesionExistente) {
            return response()->json([
                'data' => $sesionExistente->load('registrosEjercicios'),
                'message' => 'Ya tenés esta sesión iniciada.',
            ]);
        }

        $registroSesion = RegistroSesion::create([
            'entrenado_id' => $user->id,
            'sesion_id' => $sesion->id,
            'fecha' => Carbon::today(),
            'hora_inicio' => Carbon::now(),
            'completada' => false,
        ]);

        return response()->json([
            'data' => $registroSesion,
            'message' => 'Sesión iniciada correctamente.',
        ], 201);
    }

    /**
     * Finalizar sesión de entrenamiento
     */
    public function finalizarSesion(Request $request, Sesion $sesion)
    {
        $user = $request->user();

        $request->validate([
            'sensacion' => 'nullable|integer|min:1|max:10',
            'observaciones' => 'nullable|string',
        ]);

        $registroSesion = RegistroSesion::where('entrenado_id', $user->id)
            ->where('sesion_id', $sesion->id)
            ->whereDate('fecha', Carbon::today())
            ->whereNull('hora_fin')
            ->first();

        if (!$registroSesion) {
            return response()->json([
                'message' => 'No tenés una sesión iniciada.',
            ], 400);
        }

        $registroSesion->update([
            'hora_fin' => Carbon::now(),
            'completada' => true,
            'sensacion' => $request->sensacion,
            'observaciones' => $request->observaciones,
        ]);

        return response()->json([
            'data' => $registroSesion,
            'message' => 'Sesión finalizada correctamente.',
        ]);
    }

    /**
     * Registrar desempeño de un ejercicio
     */
    public function registrarEjercicio(Request $request, Sesion $sesion, SesionEjercicio $ejercicio)
    {
        $user = $request->user();

        $request->validate([
            'series_realizadas' => 'required|array|min:1',
            'series_realizadas.*.repeticiones' => 'required|integer|min:0',
            'series_realizadas.*.peso' => 'nullable|numeric|min:0',
            'series_realizadas.*.rir' => 'nullable|integer|min:0|max:10',
            'series_realizadas.*.rpe' => 'nullable|numeric|min:1|max:10',
            'series_realizadas.*.completada' => 'boolean',
            'observaciones' => 'nullable|string',
        ]);

        // Obtener registro de sesión activo
        $registroSesion = RegistroSesion::where('entrenado_id', $user->id)
            ->where('sesion_id', $sesion->id)
            ->whereDate('fecha', Carbon::today())
            ->first();

        if (!$registroSesion) {
            return response()->json([
                'message' => 'Primero debés iniciar la sesión.',
            ], 400);
        }

        // Crear o actualizar registro del ejercicio
        $registroEjercicio = RegistroEjercicio::updateOrCreate(
            [
                'registro_sesion_id' => $registroSesion->id,
                'sesion_ejercicio_id' => $ejercicio->id,
            ],
            [
                'series_realizadas' => $request->series_realizadas,
                'observaciones' => $request->observaciones,
            ]
        );

        return response()->json([
            'data' => $registroEjercicio,
            'message' => 'Desempeño registrado correctamente.',
        ]);
    }

    /**
     * Registrar sesión completa con todos los ejercicios
     */
    public function registrarSesionCompleta(Request $request, Sesion $sesion)
    {
        $user = $request->user();

        // Verificar que la sesión pertenece al usuario
        if (!$this->sesionPerteneceAUsuario($sesion, $user)) {
            return response()->json([
                'message' => 'Esta sesión no pertenece a tu plan.',
            ], 403);
        }

        $request->validate([
            'ejercicios' => 'required|array|min:1',
            'ejercicios.*.sesion_ejercicio_id' => 'required|integer|exists:sesion_ejercicios,id',
            'ejercicios.*.peso' => 'nullable|numeric|min:0',
            'ejercicios.*.repeticiones' => 'nullable|integer|min:0',
            'ejercicios.*.series_completadas' => 'required|integer|min:0',
            'ejercicios.*.intensidad_percibida' => 'nullable|integer|min:1|max:10',
            'ejercicios.*.percepcion_carga' => 'nullable|integer|min:1|max:10',
            'ejercicios.*.sensacion_general' => 'nullable|integer|min:1|max:10',
            'ejercicios.*.completado' => 'required|boolean',
            'ejercicios.*.observaciones' => 'nullable|string',
            'feedback_general' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $sesion, $user) {
            // Crear o actualizar registro de sesión
            $registroSesion = RegistroSesion::updateOrCreate(
                [
                    'sesion_id' => $sesion->id,
                    'entrenado_id' => $user->id,
                    'fecha' => Carbon::today(),
                ],
                [
                    'estado' => 'completado',
                    'feedback_general' => $request->feedback_general,
                ]
            );

            // Registrar cada ejercicio
            foreach ($request->ejercicios as $ejercicioData) {
                RegistroEjercicio::updateOrCreate(
                    [
                        'registro_sesion_id' => $registroSesion->id,
                        'sesion_ejercicio_id' => $ejercicioData['sesion_ejercicio_id'],
                    ],
                    [
                        'peso' => $ejercicioData['peso'] ?? null,
                        'repeticiones' => $ejercicioData['repeticiones'] ?? null,
                        'series_completadas' => $ejercicioData['series_completadas'],
                        'intensidad_percibida' => $ejercicioData['intensidad_percibida'] ?? null,
                        'percepcion_carga' => $ejercicioData['percepcion_carga'] ?? null,
                        'sensacion_general' => $ejercicioData['sensacion_general'] ?? null,
                        'completado' => $ejercicioData['completado'],
                        'observaciones' => $ejercicioData['observaciones'] ?? null,
                    ]
                );
            }

            return response()->json([
                'data' => $registroSesion->load('registrosEjercicio'),
                'message' => 'Sesión registrada correctamente.',
            ], 201);
        });
    }

    /**
     * Verificar si una sesión pertenece al plan del usuario
     */
    private function sesionPerteneceAUsuario(Sesion $sesion, $user): bool
    {
        return $sesion->microciclo
            ->mesociclo
            ->macrociclo
            ->entrenado_id === $user->id;
    }
}
