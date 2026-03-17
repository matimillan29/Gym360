<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Macrociclo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MacrocicloController extends Controller
{
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
     * Crear macrociclo
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
            'objetivo' => 'nullable|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'nullable|date|after:fecha_inicio',
            'notas' => 'nullable|string',
        ]);

        $macrociclo = Macrociclo::create([
            'entrenado_id' => $entrenado->id,
            'fecha_inicio' => $request->fecha_inicio,
            'fecha_fin_estimada' => $request->fecha_fin,
            'objetivo_general' => $request->objetivo,
            'activo' => false,
        ]);

        return response()->json([
            'data' => $macrociclo,
            'message' => 'Macrociclo creado correctamente.',
        ], 201);
    }

    /**
     * Ver macrociclo con sus mesociclos
     */
    public function show(Macrociclo $macrociclo)
    {
        $macrociclo->load([
            'mesociclos' => function ($q) {
                $q->orderBy('numero_orden');
            },
            'mesociclos.microciclos' => function ($q) {
                $q->orderBy('numero_orden');
            },
        ]);

        return response()->json([
            'data' => $macrociclo,
        ]);
    }

    /**
     * Actualizar macrociclo
     */
    public function update(Request $request, Macrociclo $macrociclo)
    {
        $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'objetivo' => 'nullable|string',
            'fecha_inicio' => 'sometimes|required|date',
            'fecha_fin' => 'nullable|date|after:fecha_inicio',
            'notas' => 'nullable|string',
        ]);

        $macrociclo->update($request->only([
            'nombre',
            'objetivo',
            'fecha_inicio',
            'fecha_fin',
            'notas',
        ]));

        return response()->json([
            'data' => $macrociclo,
            'message' => 'Macrociclo actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar macrociclo
     */
    public function destroy(Macrociclo $macrociclo)
    {
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

        $nuevoMacrociclo = DB::transaction(function () use ($macrociclo, $request, $targetUserId) {
            // Duplicar macrociclo
            $nuevo = $macrociclo->replicate();
            $nuevo->entrenado_id = $targetUserId;
            $nuevo->objetivo_general = $request->nombre . ' (copia)';
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

        $macrociclo = $user->macrociclos()
            ->where('activo', true)
            ->with([
                'mesociclos' => function ($q) {
                    $q->where('desbloqueado', true)
                        ->orderBy('numero_orden');
                },
                'mesociclos.microciclos' => function ($q) {
                    $q->orderBy('numero_orden');
                },
                'mesociclos.microciclos.sesiones' => function ($q) {
                    $q->orderBy('dia_semana');
                },
                'mesociclos.microciclos.sesiones.ejercicios' => function ($q) {
                    $q->orderBy('orden');
                },
                'mesociclos.microciclos.sesiones.ejercicios.ejercicio',
            ])
            ->first();

        if (!$macrociclo) {
            return response()->json([
                'data' => null,
                'message' => 'No tenés un plan activo.',
            ]);
        }

        return response()->json([
            'data' => $macrociclo,
        ]);
    }
}
