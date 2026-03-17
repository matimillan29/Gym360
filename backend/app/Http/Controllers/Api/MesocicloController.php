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
            ->orderBy('numero')
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
            'tipo' => 'required|in:introductorio,desarrollador,estabilizador,recuperacion',
            'objetivo' => 'nullable|string',
        ]);

        // Calcular próximo número
        $ultimoNumero = $macrociclo->mesociclos()->max('numero') ?? 0;

        $mesociclo = Mesociclo::create([
            'macrociclo_id' => $macrociclo->id,
            'nombre' => $request->nombre,
            'tipo' => $request->tipo,
            'numero' => $ultimoNumero + 1,
            'objetivo' => $request->objetivo,
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
                $q->orderBy('numero');
            },
            'microciclos.sesiones' => function ($q) {
                $q->orderBy('numero');
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
            'tipo' => 'sometimes|required|in:introductorio,desarrollador,estabilizador,recuperacion',
            'objetivo' => 'nullable|string',
            'numero' => 'sometimes|integer|min:1',
        ]);

        $mesociclo->update($request->only([
            'nombre',
            'tipo',
            'objetivo',
            'numero',
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
            ->where('numero', '>', $mesociclo->numero)
            ->decrement('numero');

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
