<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Macrociclo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlanSimpleController extends Controller
{
    public function index(User $entrenado)
    {
        $planes = Macrociclo::where('entrenado_id', $entrenado->id)
            ->where('tipo_plan', 'simple')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($plan) => $this->formatPlanSimple($plan));

        return response()->json(['data' => $planes]);
    }

    public function store(Request $request, User $entrenado)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'objetivo_general' => 'nullable|string',
            'duracion_semanas' => 'nullable|integer|min:1|max:52',
            'fecha_inicio' => 'nullable|date',
            'dias' => 'required|array|min:1|max:14',
            'dias.*.numero' => 'required|integer|min:1',
            'dias.*.nombre' => 'nullable|string|max:255',
            'dias.*.logica_entrenamiento' => 'nullable|string',
            'dias.*.observaciones' => 'nullable|string',
            'dias.*.ejercicios' => 'nullable|array',
            'dias.*.ejercicios.*.ejercicio_id' => 'required|exists:ejercicios,id',
            'dias.*.ejercicios.*.orden' => 'required|integer|min:1',
            'dias.*.ejercicios.*.etapa' => 'nullable|string',
            'dias.*.ejercicios.*.series' => 'required|integer|min:1',
            'dias.*.ejercicios.*.repeticiones' => 'nullable|string',
            'dias.*.ejercicios.*.tiempo' => 'nullable|integer',
            'dias.*.ejercicios.*.intensidad_tipo' => 'nullable|string|in:rir,rpe,porcentaje',
            'dias.*.ejercicios.*.intensidad_valor' => 'nullable|numeric',
            'dias.*.ejercicios.*.descanso' => 'nullable|integer',
            'dias.*.ejercicios.*.observaciones' => 'nullable|string',
            'dias.*.ejercicios.*.superserie_con' => 'nullable|integer',
        ]);

        // Desactivar planes activos anteriores
        Macrociclo::where('entrenado_id', $entrenado->id)
            ->where('activo', true)
            ->update(['activo' => false]);

        $plan = DB::transaction(function () use ($request, $entrenado) {
            $fechaInicio = $request->fecha_inicio ? \Carbon\Carbon::parse($request->fecha_inicio) : now();
            $duracionSemanas = $request->duracion_semanas;
            $fechaFin = $duracionSemanas ? $fechaInicio->copy()->addWeeks($duracionSemanas) : null;

            $macrociclo = Macrociclo::create([
                'entrenado_id' => $entrenado->id,
                'nombre' => $request->nombre,
                'objetivo_general' => $request->objetivo_general,
                'fecha_inicio' => $fechaInicio->toDateString(),
                'fecha_fin_estimada' => $fechaFin?->toDateString(),
                'duracion_semanas' => $duracionSemanas,
                'activo' => true,
                'tipo_plan' => 'simple',
            ]);

            // Auto-scaffold: mesociclo + microciclo transparentes
            $mesociclo = $macrociclo->mesociclos()->create([
                'numero' => 1,
                'nombre' => $request->nombre,
                'tipo' => 'desarrollador',
                'desbloqueado' => true,
            ]);

            $microciclo = $mesociclo->microciclos()->create([
                'numero' => 1,
                'tipo' => 'desarrollo',
            ]);

            foreach ($request->dias as $diaData) {
                $sesion = $microciclo->sesiones()->create([
                    'numero' => $diaData['numero'],
                    'nombre' => $diaData['nombre'] ?? "Día {$diaData['numero']}",
                    'logica_entrenamiento' => $diaData['logica_entrenamiento'] ?? null,
                    'observaciones' => $diaData['observaciones'] ?? null,
                ]);

                foreach ($diaData['ejercicios'] ?? [] as $ejData) {
                    $sesion->ejercicios()->create([
                        'ejercicio_id' => $ejData['ejercicio_id'],
                        'orden' => $ejData['orden'],
                        'etapa' => $ejData['etapa'] ?? 'Principal',
                        'series' => $ejData['series'],
                        'repeticiones' => $ejData['repeticiones'] ?? null,
                        'tiempo' => $ejData['tiempo'] ?? null,
                        'intensidad_tipo' => $ejData['intensidad_tipo'] ?? null,
                        'intensidad_valor' => $ejData['intensidad_valor'] ?? null,
                        'descanso' => $ejData['descanso'] ?? 90,
                        'observaciones' => $ejData['observaciones'] ?? null,
                        'superserie_con' => $ejData['superserie_con'] ?? null,
                    ]);
                }
            }

            return $macrociclo;
        });

        return response()->json([
            'data' => $this->formatPlanSimple($plan->fresh(['mesociclos.microciclos.sesiones.ejercicios.ejercicio', 'mesociclos.microciclos.sesiones.registros'])),
            'message' => 'Plan creado correctamente.',
        ], 201);
    }

    public function show(Macrociclo $plan)
    {
        if ($plan->tipo_plan !== 'simple') {
            return response()->json(['message' => 'Este plan no es simple.'], 400);
        }

        $plan->load([
            'mesociclos.microciclos.sesiones.ejercicios.ejercicio',
            'mesociclos.microciclos.sesiones.registros',
        ]);

        return response()->json([
            'data' => $this->formatPlanSimple($plan),
        ]);
    }

    public function update(Request $request, Macrociclo $plan)
    {
        if ($plan->tipo_plan !== 'simple') {
            return response()->json(['message' => 'Este plan no es simple.'], 400);
        }

        $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'objetivo_general' => 'nullable|string',
            'duracion_semanas' => 'nullable|integer|min:1|max:52',
            'dias' => 'sometimes|array|min:1|max:14',
            'dias.*.numero' => 'required|integer|min:1',
            'dias.*.nombre' => 'nullable|string|max:255',
            'dias.*.logica_entrenamiento' => 'nullable|string',
            'dias.*.observaciones' => 'nullable|string',
            'dias.*.ejercicios' => 'nullable|array',
            'dias.*.ejercicios.*.ejercicio_id' => 'required|exists:ejercicios,id',
            'dias.*.ejercicios.*.orden' => 'required|integer|min:1',
            'dias.*.ejercicios.*.etapa' => 'nullable|string',
            'dias.*.ejercicios.*.series' => 'required|integer|min:1',
            'dias.*.ejercicios.*.repeticiones' => 'nullable|string',
            'dias.*.ejercicios.*.tiempo' => 'nullable|integer',
            'dias.*.ejercicios.*.intensidad_tipo' => 'nullable|string|in:rir,rpe,porcentaje',
            'dias.*.ejercicios.*.intensidad_valor' => 'nullable|numeric',
            'dias.*.ejercicios.*.descanso' => 'nullable|integer',
            'dias.*.ejercicios.*.observaciones' => 'nullable|string',
        ]);

        try {
        DB::transaction(function () use ($request, $plan) {
            $updateData = [
                'nombre' => $request->nombre ?? $plan->nombre,
                'objetivo_general' => $request->objetivo_general ?? $plan->objetivo_general,
            ];
            if ($request->has('duracion_semanas')) {
                $updateData['duracion_semanas'] = $request->duracion_semanas;
                if ($request->duracion_semanas && $plan->fecha_inicio) {
                    $updateData['fecha_fin_estimada'] = \Carbon\Carbon::parse($plan->fecha_inicio)
                        ->addWeeks($request->duracion_semanas)->toDateString();
                }
            }
            $plan->update($updateData);

            if ($request->has('dias')) {
                $microciclo = $plan->mesociclos->first()?->microciclos->first();
                if ($microciclo) {
                    // Proteger registros existentes
                    $tieneRegistros = \App\Models\RegistroSesion::whereIn(
                        'sesion_id', $microciclo->sesiones()->pluck('id')
                    )->exists();

                    if ($tieneRegistros) {
                        throw new \Exception('TIENE_REGISTROS');
                    }

                    // Delete old sesiones and recreate
                    $microciclo->sesiones()->each(function ($sesion) {
                        $sesion->ejercicios()->delete();
                        $sesion->delete();
                    });

                    foreach ($request->dias as $diaData) {
                        $sesion = $microciclo->sesiones()->create([
                            'numero' => $diaData['numero'],
                            'nombre' => $diaData['nombre'] ?? "Día {$diaData['numero']}",
                            'logica_entrenamiento' => $diaData['logica_entrenamiento'] ?? null,
                            'observaciones' => $diaData['observaciones'] ?? null,
                        ]);

                        foreach ($diaData['ejercicios'] ?? [] as $ejData) {
                            $sesion->ejercicios()->create([
                                'ejercicio_id' => $ejData['ejercicio_id'],
                                'orden' => $ejData['orden'],
                                'etapa' => $ejData['etapa'] ?? 'Principal',
                                'series' => $ejData['series'],
                                'repeticiones' => $ejData['repeticiones'] ?? null,
                                'tiempo' => $ejData['tiempo'] ?? null,
                                'intensidad_tipo' => $ejData['intensidad_tipo'] ?? null,
                                'intensidad_valor' => $ejData['intensidad_valor'] ?? null,
                                'descanso' => $ejData['descanso'] ?? 90,
                                'observaciones' => $ejData['observaciones'] ?? null,
                                'superserie_con' => $ejData['superserie_con'] ?? null,
                            ]);
                        }
                    }
                }
            }
        });
        } catch (\Exception $e) {
            if ($e->getMessage() === 'TIENE_REGISTROS') {
                return response()->json([
                    'message' => 'No se puede modificar la estructura del plan porque el entrenado ya tiene registros de sesiones. Creá un plan nuevo.',
                ], 409);
            }
            throw $e;
        }

        return response()->json([
            'data' => $this->formatPlanSimple($plan->fresh([
                'mesociclos.microciclos.sesiones.ejercicios.ejercicio',
                'mesociclos.microciclos.sesiones.registros',
            ])),
            'message' => 'Plan actualizado correctamente.',
        ]);
    }

    public function destroy(Macrociclo $plan)
    {
        if ($plan->tipo_plan !== 'simple') {
            return response()->json(['message' => 'Este plan no es simple.'], 400);
        }

        $plan->delete();

        return response()->json(['message' => 'Plan eliminado correctamente.']);
    }

    public function activar(Macrociclo $plan)
    {
        // Desactivar otros planes del mismo entrenado
        Macrociclo::where('entrenado_id', $plan->entrenado_id)
            ->where('id', '!=', $plan->id)
            ->where('activo', true)
            ->update(['activo' => false]);

        $plan->update(['activo' => true]);

        return response()->json([
            'data' => $this->formatPlanSimple($plan->fresh(['mesociclos.microciclos.sesiones.ejercicios.ejercicio', 'mesociclos.microciclos.sesiones.registros'])),
            'message' => 'Plan activado correctamente.',
        ]);
    }

    private function formatPlanSimple(Macrociclo $plan): array
    {
        $sesiones = $plan->mesociclos->first()
            ?->microciclos->first()
            ?->sesiones ?? collect();

        // Calcular semana actual
        $semanaActual = 1;
        $totalSemanas = $plan->duracion_semanas;
        if ($plan->fecha_inicio && $totalSemanas) {
            $inicio = \Carbon\Carbon::parse($plan->fecha_inicio)->startOfWeek();
            $ahora = now()->startOfWeek();
            $semanaActual = max(1, min($totalSemanas, (int) $inicio->diffInWeeks($ahora) + 1));
        }

        // Contar registros totales por día (cuántas semanas se completó cada día)
        $registrosPorDia = [];
        foreach ($sesiones as $sesion) {
            $registrosPorDia[$sesion->id] = $sesion->registros
                ? $sesion->registros->where('entrenado_id', $plan->entrenado_id)->count()
                : 0;
        }

        return [
            'id' => $plan->id,
            'tipo_plan' => 'simple',
            'nombre' => $plan->nombre,
            'objetivo_general' => $plan->objetivo_general,
            'fecha_inicio' => $plan->fecha_inicio,
            'fecha_fin_estimada' => $plan->fecha_fin_estimada,
            'duracion_semanas' => $totalSemanas,
            'semana_actual' => $semanaActual,
            'activo' => $plan->activo,
            'entrenado_id' => $plan->entrenado_id,
            'created_at' => $plan->created_at,
            'dias' => $sesiones->sortBy('numero')->values()->map(function ($sesion) use ($plan, $registrosPorDia, $semanaActual) {
                // Buscar si ya registró esta semana (por fecha)
                $inicioSemanaActual = $plan->fecha_inicio
                    ? \Carbon\Carbon::parse($plan->fecha_inicio)->startOfWeek()->addWeeks($semanaActual - 1)
                    : now()->startOfWeek();
                $finSemanaActual = $inicioSemanaActual->copy()->endOfWeek();

                $registroEstaSemana = $sesion->registros
                    ? $sesion->registros
                        ->where('entrenado_id', $plan->entrenado_id)
                        ->filter(fn($r) => $r->fecha >= $inicioSemanaActual && $r->fecha <= $finSemanaActual)
                        ->first()
                    : null;

                return [
                    'id' => $sesion->id,
                    'numero' => $sesion->numero,
                    'nombre' => $sesion->nombre,
                    'logica_entrenamiento' => $sesion->logica_entrenamiento,
                    'observaciones' => $sesion->observaciones,
                    'completada' => $registroEstaSemana !== null,
                    'veces_completada' => $registrosPorDia[$sesion->id] ?? 0,
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
        ];
    }
}
