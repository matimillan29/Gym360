<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mesociclo;
use App\Models\Microciclo;
use Illuminate\Http\Request;

class MicrocicloController extends Controller
{
    /**
     * Verificar que el entrenador autenticado es dueño del entrenado vinculado al microciclo
     */
    private function authorizeMicrociclo(Microciclo $microciclo): bool
    {
        $user = auth()->user();
        if ($user->isAdmin()) return true;
        $microciclo->loadMissing('mesociclo.macrociclo.entrenado');
        return $microciclo->mesociclo
            && $microciclo->mesociclo->macrociclo
            && $microciclo->mesociclo->macrociclo->entrenado
            && $microciclo->mesociclo->macrociclo->entrenado->entrenador_asignado_id === $user->id;
    }

    /**
     * Listar microciclos de un mesociclo
     */
    public function index(Mesociclo $mesociclo)
    {
        $microciclos = $mesociclo->microciclos()
            ->withCount('sesiones')
            ->orderBy('numero')
            ->get();

        return response()->json([
            'data' => $microciclos,
        ]);
    }

    /**
     * Crear microciclo
     */
    public function store(Request $request, Mesociclo $mesociclo)
    {
        $request->validate([
            'tipo' => 'required|in:introductorio,desarrollo,estabilizacion,descarga',
            'nombre' => 'nullable|string|max:255',
        ]);

        // Calcular próximo número
        $ultimoNumero = $mesociclo->microciclos()->max('numero') ?? 0;

        $microciclo = Microciclo::create([
            'mesociclo_id' => $mesociclo->id,
            'tipo' => $request->tipo,
            'nombre' => $request->nombre,
            'numero' => $ultimoNumero + 1,
        ]);

        return response()->json([
            'data' => $microciclo,
            'message' => 'Microciclo creado correctamente.',
        ], 201);
    }

    /**
     * Ver microciclo con sus sesiones
     */
    public function show(Microciclo $microciclo)
    {
        if (!$this->authorizeMicrociclo($microciclo)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $microciclo->load([
            'sesiones' => function ($q) {
                $q->orderBy('numero');
            },
            'sesiones.ejercicios' => function ($q) {
                $q->orderBy('orden');
            },
            'sesiones.ejercicios.ejercicio',
        ]);

        return response()->json([
            'data' => $microciclo,
        ]);
    }

    /**
     * Actualizar microciclo
     */
    public function update(Request $request, Microciclo $microciclo)
    {
        if (!$this->authorizeMicrociclo($microciclo)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $request->validate([
            'tipo' => 'sometimes|required|in:introductorio,desarrollo,estabilizacion,descarga',
            'numero' => 'sometimes|integer|min:1',
            'nombre' => 'nullable|string|max:255',
        ]);

        $microciclo->update($request->only([
            'tipo',
            'numero',
            'nombre',
        ]));

        return response()->json([
            'data' => $microciclo,
            'message' => 'Microciclo actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar microciclo
     */
    public function destroy(Microciclo $microciclo)
    {
        if (!$this->authorizeMicrociclo($microciclo)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $mesocicloId = $microciclo->mesociclo_id;
        $numero = $microciclo->numero;

        $microciclo->delete();

        // Reordenar los restantes
        Microciclo::where('mesociclo_id', $mesocicloId)
            ->where('numero', '>', $numero)
            ->decrement('numero');

        return response()->json([
            'message' => 'Microciclo eliminado correctamente.',
        ]);
    }
}
