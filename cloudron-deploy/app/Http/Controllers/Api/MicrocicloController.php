<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mesociclo;
use App\Models\Microciclo;
use Illuminate\Http\Request;

class MicrocicloController extends Controller
{
    /**
     * Listar microciclos de un mesociclo
     */
    public function index(Mesociclo $mesociclo)
    {
        $microciclos = $mesociclo->microciclos()
            ->withCount('sesiones')
            ->orderBy('numero_orden')
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
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|in:carga,descarga,competicion,recuperacion,test',
            'objetivo' => 'nullable|string',
            'notas' => 'nullable|string',
        ]);

        // Calcular próximo número de orden
        $ultimoOrden = $mesociclo->microciclos()->max('numero_orden') ?? 0;

        $microciclo = Microciclo::create([
            'mesociclo_id' => $mesociclo->id,
            'nombre' => $request->nombre,
            'tipo' => $request->tipo,
            'numero_orden' => $ultimoOrden + 1,
            'objetivo' => $request->objetivo,
            'notas' => $request->notas,
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
        $microciclo->load([
            'sesiones' => function ($q) {
                $q->orderBy('dia_semana');
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
        $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'tipo' => 'sometimes|required|in:carga,descarga,competicion,recuperacion,test',
            'objetivo' => 'nullable|string',
            'notas' => 'nullable|string',
            'numero_orden' => 'sometimes|integer|min:1',
        ]);

        $microciclo->update($request->only([
            'nombre',
            'tipo',
            'objetivo',
            'notas',
            'numero_orden',
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
        $mesocicloId = $microciclo->mesociclo_id;
        $orden = $microciclo->numero_orden;

        $microciclo->delete();

        // Reordenar los restantes
        Microciclo::where('mesociclo_id', $mesocicloId)
            ->where('numero_orden', '>', $orden)
            ->decrement('numero_orden');

        return response()->json([
            'message' => 'Microciclo eliminado correctamente.',
        ]);
    }
}
