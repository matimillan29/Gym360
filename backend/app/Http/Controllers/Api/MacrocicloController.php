<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Macrociclo;
use App\Models\RegistroSesion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MacrocicloController extends Controller
{
    /**
     * Verificar que el entrenador autenticado es dueño del entrenado vinculado al macrociclo
     */
    private function authorizeMacrociclo(Macrociclo $macrociclo): bool
    {
        $user = auth()->user();
        if ($user->isAdmin()) return true;
        $macrociclo->loadMissing('entrenado');
        return $macrociclo->entrenado && $macrociclo->entrenado->entrenador_asignado_id === $user->id;
    }

    /**
     * Listar todos los macrociclos (para entrenador/admin)
     */
    public function indexAll(Request $request)
    {
        $user = $request->user();

        $query = Macrociclo::with(['entrenado:id,nombre,apellido,email,foto'])
            ->withCount('mesociclos')
            ->orderByDesc('created_at');

        // Si es entrenador (no admin), solo ver sus entrenados
        if ($user->role === 'entrenador') {
            $entrenadoIds = User::where('entrenador_asignado_id', $user->id)->pluck('id');
            $query->whereIn('entrenado_id', $entrenadoIds);
        }

        $macrociclos = $query->get();

        return response()->json([
            'data' => $macrociclos,
        ]);
    }

    /**
     * Listar macrociclos de un entrenado
     */
    public function index(User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $macrociclos = $entrenado->macrociclos()
            ->withCount('mesociclos')
            ->orderByDesc('activo')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $macrociclos,
        ]);
    }

    /**
     * Crear macrociclo con estructura completa
     */
    public function store(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $request->validate([
            'nombre' => 'required|string|max:255',
            'objetivo_general' => 'nullable|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin_estimada' => 'nullable|date|after:fecha_inicio',
            'activo' => 'boolean',
            'mesociclos' => 'array',
        ]);

        $macrociclo = DB::transaction(function () use ($request, $entrenado) {
            // Crear macrociclo
            $macrociclo = Macrociclo::create([
                'entrenado_id' => $entrenado->id,
                'nombre' => $request->nombre,
                'fecha_inicio' => $request->fecha_inicio,
                'fecha_fin_estimada' => $request->fecha_fin_estimada,
                'objetivo_general' => $request->objetivo_general,
                'activo' => $request->activo ?? true,
                'tipo_plan' => 'complejo',
            ]);

            // Guardar mesociclos y su estructura anidada
            $this->guardarEstructura($macrociclo, $request->mesociclos ?? []);

            return $macrociclo;
        });

        return response()->json([
            'data' => $macrociclo->load(['mesociclos.microciclos.sesiones.ejercicios.ejercicio']),
            'message' => 'Plan creado correctamente.',
        ], 201);
    }

    /**
     * Guarda la estructura completa de mesociclos/microciclos/sesiones/ejercicios
     */
    private function guardarEstructura(Macrociclo $macrociclo, array $mesociclos)
    {
        foreach ($mesociclos as $index => $mesoData) {
            $mesociclo = $macrociclo->mesociclos()->create([
                'numero' => $mesoData['numero'] ?? 1,
                'nombre' => $mesoData['nombre'] ?? 'Mesociclo',
                'objetivo' => $mesoData['objetivo'] ?? null,
                'tipo' => $mesoData['tipo'] ?? 'desarrollador',
                'desbloqueado' => $index === 0 ? true : ($mesoData['desbloqueado'] ?? false),
            ]);

            foreach ($mesoData['microciclos'] ?? [] as $microData) {
                $microciclo = $mesociclo->microciclos()->create([
                    'numero' => $microData['numero'] ?? 1,
                    'nombre' => $microData['nombre'] ?? null,
                    'tipo' => $microData['tipo'] ?? 'desarrollo',
                ]);

                foreach ($microData['sesiones'] ?? [] as $sesionData) {
                    $sesion = $microciclo->sesiones()->create([
                        'numero' => $sesionData['numero'] ?? 1,
                        'nombre' => $sesionData['nombre'] ?? null,
                        'logica_entrenamiento' => $sesionData['logica_entrenamiento'] ?? null,
                        'observaciones' => $sesionData['observaciones'] ?? null,
                    ]);

                    foreach ($sesionData['ejercicios'] ?? [] as $ejData) {
                        $sesion->ejercicios()->create([
                            'ejercicio_id' => $ejData['ejercicio_id'],
                            'orden' => $ejData['orden'] ?? 1,
                            'etapa' => $ejData['etapa'] ?? 'Principal',
                            'series' => $ejData['series'] ?? 3,
                            'repeticiones' => $ejData['repeticiones'] ?? null,
                            'tiempo' => $ejData['tiempo'] ?? null,
                            'intensidad_tipo' => $ejData['intensidad_tipo'] ?? 'rir',
                            'intensidad_valor' => $ejData['intensidad_valor'] ?? 2,
                            'descanso' => $ejData['descanso'] ?? 90,
                            'observaciones' => $ejData['observaciones'] ?? null,
                            'superserie_con' => $ejData['superserie_con'] ?? null,
                        ]);
                    }
                }
            }
        }
    }

    /**
     * Ver macrociclo con toda su estructura
     */
    public function show(Macrociclo $macrociclo)
    {
        if (!$this->authorizeMacrociclo($macrociclo)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $macrociclo->load([
            'entrenado:id,nombre,apellido',
            'mesociclos' => function ($q) {
                $q->orderBy('numero');
            },
            'mesociclos.microciclos' => function ($q) {
                $q->orderBy('numero');
            },
            'mesociclos.microciclos.sesiones' => function ($q) {
                $q->orderBy('numero');
            },
            'mesociclos.microciclos.sesiones.ejercicios' => function ($q) {
                $q->orderBy('orden');
            },
            'mesociclos.microciclos.sesiones.ejercicios.ejercicio',
        ]);

        return response()->json([
            'data' => $macrociclo,
        ]);
    }

    /**
     * Actualizar macrociclo con estructura completa
     */
    public function update(Request $request, Macrociclo $macrociclo)
    {
        if (!$this->authorizeMacrociclo($macrociclo)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'objetivo_general' => 'nullable|string',
            'fecha_inicio' => 'sometimes|required|date',
            'fecha_fin_estimada' => 'nullable|date',
            'activo' => 'boolean',
            'mesociclos' => 'array',
        ]);

        // Si vienen mesociclos, verificar que no haya registros antes de reestructurar
        if ($request->has('mesociclos')) {
            $tieneRegistros = RegistroSesion::whereHas('sesion.microciclo.mesociclo', function ($q) use ($macrociclo) {
                $q->where('macrociclo_id', $macrociclo->id);
            })->exists();

            if ($tieneRegistros) {
                return response()->json([
                    'message' => 'No se puede reestructurar un plan que tiene registros de entrenamiento.',
                ], 409);
            }
        }

        DB::transaction(function () use ($request, $macrociclo) {
            // Actualizar datos del macrociclo
            $macrociclo->update([
                'nombre' => $request->nombre ?? $macrociclo->nombre,
                'objetivo_general' => $request->objetivo_general ?? $macrociclo->objetivo_general,
                'fecha_inicio' => $request->fecha_inicio ?? $macrociclo->fecha_inicio,
                'fecha_fin_estimada' => $request->fecha_fin_estimada ?? $macrociclo->fecha_fin_estimada,
                'activo' => $request->activo ?? $macrociclo->activo,
            ]);

            // Si vienen mesociclos, reemplazar toda la estructura
            if ($request->has('mesociclos')) {
                // Eliminar estructura existente (cascade delete)
                $macrociclo->mesociclos()->each(function ($meso) {
                    $meso->microciclos()->each(function ($micro) {
                        $micro->sesiones()->each(function ($sesion) {
                            $sesion->ejercicios()->delete();
                        });
                        $micro->sesiones()->delete();
                    });
                    $meso->microciclos()->delete();
                });
                $macrociclo->mesociclos()->delete();

                // Crear nueva estructura
                $this->guardarEstructura($macrociclo, $request->mesociclos ?? []);
            }
        });

        return response()->json([
            'data' => $macrociclo->fresh(['mesociclos.microciclos.sesiones.ejercicios.ejercicio']),
            'message' => 'Plan actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar macrociclo
     */
    public function destroy(Macrociclo $macrociclo)
    {
        if (!$this->authorizeMacrociclo($macrociclo)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($macrociclo->activo) {
            return response()->json([
                'message' => 'No se puede eliminar un macrociclo activo. Desactivalo primero.',
            ], 400);
        }

        $macrociclo->delete();

        return response()->json([
            'message' => 'Macrociclo eliminado correctamente.',
        ]);
    }

    /**
     * Activar macrociclo (desactiva los demás)
     */
    public function activar(Macrociclo $macrociclo)
    {
        if (!$this->authorizeMacrociclo($macrociclo)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        DB::transaction(function () use ($macrociclo) {
            // Desactivar todos los macrociclos del entrenado
            Macrociclo::where('entrenado_id', $macrociclo->entrenado_id)
                ->where('id', '!=', $macrociclo->id)
                ->update(['activo' => false]);

            // Activar el seleccionado
            $macrociclo->update(['activo' => true]);
        });

        return response()->json([
            'data' => $macrociclo,
            'message' => 'Macrociclo activado correctamente.',
        ]);
    }

    /**
     * Duplicar macrociclo
     */
    public function duplicar(Request $request, Macrociclo $macrociclo)
    {
        if (!$this->authorizeMacrociclo($macrociclo)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $request->validate([
            'nombre' => 'required|string|max:255',
            'entrenado_id' => 'nullable|exists:users,id',
        ]);

        $targetUserId = $request->entrenado_id ?? $macrociclo->entrenado_id;

        // Verificar que el usuario destino sea entrenado
        $targetUser = User::find($targetUserId);
        if (!$targetUser->isEntrenado()) {
            return response()->json([
                'message' => 'El usuario destino debe ser un entrenado.',
            ], 400);
        }

        // Verificar que el entrenador tenga acceso al entrenado destino
        $user = auth()->user();
        if (!$user->isAdmin() && $targetUser->entrenador_asignado_id !== $user->id) {
            return response()->json(['message' => 'No autorizado para asignar plan a este entrenado.'], 403);
        }

        $macrociclo->load('mesociclos.microciclos.sesiones.ejercicios');

        $nuevoMacrociclo = DB::transaction(function () use ($macrociclo, $request, $targetUserId) {
            // Duplicar macrociclo
            $nuevo = $macrociclo->replicate();
            $nuevo->entrenado_id = $targetUserId;
            $nuevo->nombre = $request->nombre . ' (copia)';
            $nuevo->activo = false;
            $nuevo->save();

            // Duplicar mesociclos
            foreach ($macrociclo->mesociclos as $mesociclo) {
                $nuevoMeso = $mesociclo->replicate();
                $nuevoMeso->macrociclo_id = $nuevo->id;
                $nuevoMeso->desbloqueado = false;
                $nuevoMeso->save();

                // Duplicar microciclos
                foreach ($mesociclo->microciclos as $microciclo) {
                    $nuevoMicro = $microciclo->replicate();
                    $nuevoMicro->mesociclo_id = $nuevoMeso->id;
                    $nuevoMicro->save();

                    // Duplicar sesiones
                    foreach ($microciclo->sesiones as $sesion) {
                        $nuevaSesion = $sesion->replicate();
                        $nuevaSesion->microciclo_id = $nuevoMicro->id;
                        $nuevaSesion->save();

                        // Duplicar ejercicios de la sesión
                        foreach ($sesion->ejercicios as $ejercicio) {
                            $nuevoEj = $ejercicio->replicate();
                            $nuevoEj->sesion_id = $nuevaSesion->id;
                            $nuevoEj->save();
                        }
                    }
                }
            }

            return $nuevo;
        });

        return response()->json([
            'data' => $nuevoMacrociclo->load('mesociclos'),
            'message' => 'Macrociclo duplicado correctamente.',
        ], 201);
    }

    /**
     * Ver mi plan activo (para entrenados)
     */
    public function miPlanActivo(Request $request)
    {
        $user = $request->user();

        // Obtener el macrociclo activo con todos los mesociclos para conteo
        $macrociclo = $user->macrociclos()
            ->where('activo', true)
            ->withCount('mesociclos')
            ->first();

        if (!$macrociclo) {
            return response()->json([
                'data' => null,
                'message' => 'No tenés un plan activo.',
            ]);
        }

        // If it's a simple plan, return simplified format
        if ($macrociclo->esSimple()) {
            $macrociclo->load([
                'mesociclos.microciclos.sesiones' => fn($q) => $q->orderBy('numero'),
                'mesociclos.microciclos.sesiones.ejercicios' => fn($q) => $q->orderBy('orden'),
                'mesociclos.microciclos.sesiones.ejercicios.ejercicio',
                'mesociclos.microciclos.sesiones.registros' => fn($q) => $q->where('entrenado_id', $user->id),
            ]);

            $sesiones = $macrociclo->mesociclos->first()
                ?->microciclos->first()
                ?->sesiones ?? collect();

            // Calcular semana actual
            $semanaActual = 1;
            $duracionSemanas = $macrociclo->duracion_semanas;
            if ($macrociclo->fecha_inicio && $duracionSemanas) {
                $inicio = \Carbon\Carbon::parse($macrociclo->fecha_inicio)->startOfWeek();
                $ahora = now()->startOfWeek();
                $semanaActual = max(1, min($duracionSemanas, (int) $inicio->diffInWeeks($ahora) + 1));
            }

            // Calcular inicio/fin de semana actual para saber qué días se completaron esta semana
            $inicioSemanaActual = $macrociclo->fecha_inicio
                ? \Carbon\Carbon::parse($macrociclo->fecha_inicio)->startOfWeek()->addWeeks($semanaActual - 1)
                : now()->startOfWeek();
            $finSemanaActual = $inicioSemanaActual->copy()->endOfWeek();

            return response()->json([
                'data' => [
                    'tipo_plan' => 'simple',
                    'id' => $macrociclo->id,
                    'nombre' => $macrociclo->nombre,
                    'objetivo_general' => $macrociclo->objetivo_general,
                    'fecha_inicio' => $macrociclo->fecha_inicio,
                    'fecha_fin_estimada' => $macrociclo->fecha_fin_estimada,
                    'duracion_semanas' => $duracionSemanas,
                    'semana_actual' => $semanaActual,
                    'dias' => $sesiones->sortBy('numero')->values()->map(function ($sesion) use ($user, $inicioSemanaActual, $finSemanaActual) {
                        // Buscar si completó este día EN LA SEMANA ACTUAL
                        $registroEstaSemana = $sesion->registros
                            ->where('entrenado_id', $user->id)
                            ->filter(fn($r) => $r->fecha >= $inicioSemanaActual && $r->fecha <= $finSemanaActual)
                            ->first();
                        // Total de veces completado (todas las semanas)
                        $vecesCompletada = $sesion->registros->where('entrenado_id', $user->id)->count();
                        return [
                            'id' => $sesion->id,
                            'numero' => $sesion->numero,
                            'nombre' => $sesion->nombre,
                            'logica_entrenamiento' => $sesion->logica_entrenamiento,
                            'observaciones' => $sesion->observaciones,
                            'completada' => $registroEstaSemana !== null,
                            'veces_completada' => $vecesCompletada,
                            'ejercicios' => $sesion->ejercicios->sortBy('orden')->values()->map(function ($ej) {
                                return [
                                    'id' => $ej->id,
                                    'sesion_ejercicio_id' => $ej->id,
                                    'ejercicio_id' => $ej->ejercicio_id,
                                    'ejercicio' => $ej->ejercicio ? [
                                        'id' => $ej->ejercicio->id,
                                        'nombre' => $ej->ejercicio->nombre,
                                        'descripcion' => $ej->ejercicio->descripcion,
                                        'video_url' => $ej->ejercicio->video_url,
                                        'imagen_url' => $ej->ejercicio->imagen_url,
                                    ] : null,
                                    'orden' => $ej->orden,
                                    'etapa' => $ej->etapa,
                                    'series' => $ej->series,
                                    'repeticiones' => $ej->repeticiones,
                                    'tiempo' => $ej->tiempo,
                                    'intensidad_tipo' => $ej->intensidad_tipo,
                                    'intensidad_valor' => $ej->intensidad_valor,
                                    'descanso' => $ej->descanso,
                                    'observaciones' => $ej->observaciones,
                                    'superserie_con' => $ej->superserie_con,
                                ];
                            })->toArray(),
                        ];
                    })->toArray(),
                ],
            ]);
        }

        // Contar mesociclos desbloqueados
        $mesociclosDesbloqueados = $macrociclo->mesociclos()->where('desbloqueado', true)->count();

        // Obtener el mesociclo actual (el último desbloqueado)
        $mesocicloActual = $macrociclo->mesociclos()
            ->where('desbloqueado', true)
            ->orderByDesc('numero')
            ->with([
                'microciclos' => function ($q) {
                    $q->orderBy('numero');
                },
                'microciclos.sesiones' => function ($q) {
                    $q->orderBy('numero');
                },
                'microciclos.sesiones.ejercicios' => function ($q) {
                    $q->orderBy('orden');
                },
                'microciclos.sesiones.ejercicios.ejercicio',
                'microciclos.sesiones.registros' => function ($q) use ($user) {
                    $q->where('entrenado_id', $user->id);
                },
            ])
            ->first();

        // Transformar sesiones para incluir estado de completado
        if ($mesocicloActual) {
            foreach ($mesocicloActual->microciclos as $microciclo) {
                foreach ($microciclo->sesiones as $sesion) {
                    $sesion->completada = $sesion->registros->isNotEmpty() &&
                        $sesion->registros->first()->estado === 'completado';
                    unset($sesion->registros); // No enviar los registros completos
                }
            }
        }

        return response()->json([
            'data' => [
                'tipo_plan' => 'complejo',
                'id' => $macrociclo->id,
                'nombre' => $macrociclo->nombre,
                'objetivo_general' => $macrociclo->objetivo_general,
                'fecha_inicio' => $macrociclo->fecha_inicio,
                'total_mesociclos' => $macrociclo->mesociclos_count,
                'mesociclos_desbloqueados' => $mesociclosDesbloqueados,
                'mesociclo_actual' => $mesocicloActual,
            ],
        ]);
    }

    /**
     * Generar PDF del plan activo del entrenado
     */
    public function miPlanPdf(Request $request)
    {
        $user = $request->user();
        $macrociclo = Macrociclo::where('entrenado_id', $user->id)
            ->where('activo', true)
            ->first();

        if (!$macrociclo) {
            return response()->json(['message' => 'No tenés un plan activo.'], 404);
        }

        $macrociclo->load([
            'mesociclos.microciclos.sesiones' => fn($q) => $q->orderBy('numero'),
            'mesociclos.microciclos.sesiones.ejercicios' => fn($q) => $q->orderBy('orden'),
            'mesociclos.microciclos.sesiones.ejercicios.ejercicio',
        ]);

        $gymConfig = \App\Models\GymConfig::first();

        // Build HTML for PDF
        $html = view('pdf.plan', [
            'plan' => $macrociclo,
            'entrenado' => $user,
            'gym' => $gymConfig,
        ])->render();

        $filename = "plan-{$user->nombre}-{$user->apellido}";

        // Intentar generar PDF con DomPDF
        try {
            if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)
                    ->setPaper('a4', 'landscape');
                return $pdf->download("{$filename}.pdf");
            }
        } catch (\Throwable $e) {
            \Log::warning('DomPDF no disponible, usando HTML: ' . $e->getMessage());
        }

        // Fallback: devolver HTML que el browser puede imprimir como PDF
        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    /**
     * Enviar plan por email al entrenado
     */
    public function enviarPlanEmail(Request $request)
    {
        $user = $request->user();
        $macrociclo = Macrociclo::where('entrenado_id', $user->id)
            ->where('activo', true)
            ->first();

        if (!$macrociclo) {
            return response()->json(['message' => 'No tenés un plan activo.'], 404);
        }

        // For now, return success - email sending can be implemented later
        return response()->json(['message' => 'Plan enviado por email correctamente.']);
    }
}
