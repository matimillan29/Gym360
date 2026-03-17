<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Macrociclo;
use App\Models\Mesociclo;
use Illuminate\Http\Request;

class MesocicloController extends Controller
{
    /**
     * Listar mesociclos de un macrociclo
     */
    public function index(Macrociclo $macrociclo)
    {
        $mesociclos = $macrociclo->mesociclos()
            ->withCount('microciclos')
            ->orderBy('numero_orden')
            ->get();

        return response()->json([
            'data' => $mesociclos,
        ]);
    }

    /**
     * Crear mesociclo
     */
    public function store(Request $request, Macrociclo $macrociclo)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|in:preparatorio,competitivo,transicion,acumulacion,transmutacion,realizacion',
            'duracion_semanas' => 'required|integer|min:1|max:12',
            'objetivo' => 'nullable|string',
            'notas' => 'nullable|string',
        ]);

        // Calcular próximo número de orden
        $ultimoOrden = $macrociclo->mesociclos()->max('numero_orden') ?? 0;

        $mesociclo = Mesociclo::create([
            'macrociclo_id' => $macrociclo->id,
            'nombre' => $request->nombre,
            'tipo' => $request->tipo,
            'numero_orden' => $ultimoOrden + 1,
            'duracion_semanas' => $request->duracion_semanas,
            'objetivo' => $request->objetivo,
            'notas' => $request->notas,
            'desbloqueado' => $macrociclo->mesociclos()->count() === 0, // El primero se desbloquea
        ]);

        return response()->json([
            'data' => $mesociclo,
            'message' => 'Mesociclo creado correctamente.',
        ], 201);
    }

    /**
     * Ver mesociclo con sus microciclos
     */
    public function show(Mesociclo $mesociclo)
    {
        $mesociclo->load([
            'microciclos' => function ($q) {
                $q->orderBy('numero_orden');
            },
            'microciclos.sesiones' => function ($q) {
                $q->orderBy('dia_semana');
            },
        ]);

        return response()->json([
            'data' => $mesociclo,
        ]);
    }

    /**
     * Actualizar mesociclo
     */
    public function update(Request $request, Mesociclo $mesociclo)
    {
        $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'tipo' => 'sometimes|required|in:preparatorio,competitivo,transicion,acumulacion,transmutacion,realizacion',
            'duracion_semanas' => 'sometimes|required|integer|min:1|max:12',
            'objetivo' => 'nullable|string',
            'notas' => 'nullable|string',
            'numero_orden' => 'sometimes|integer|min:1',
        ]);

        $mesociclo->update($request->only([
            'nombre',
            'tipo',
            'duracion_semanas',
            'objetivo',
            'notas',
            'numero_orden',
        ]));

        return response()->json([
            'data' => $mesociclo,
            'message' => 'Mesociclo actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar mesociclo
     */
    public function destroy(Mesociclo $mesociclo)
    {
        $mesociclo->delete();

        // Reordenar los restantes
        Mesociclo::where('macrociclo_id', $mesociclo->macrociclo_id)
            ->where('numero_orden', '>', $mesociclo->numero_orden)
            ->decrement('numero_orden');

        return response()->json([
            'message' => 'Mesociclo eliminado correctamente.',
        ]);
    }

    /**
     * Desbloquear mesociclo para el entrenado
     */
    public function desbloquear(Mesociclo $mesociclo)
    {
        $mesociclo->update(['desbloqueado' => true]);

        return response()->json([
            'data' => $mesociclo,
            'message' => 'Mesociclo desbloqueado correctamente.',
        ]);
    }
}
