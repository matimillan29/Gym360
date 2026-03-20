<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Evaluacion;
use Illuminate\Http\Request;

class EvaluacionController extends Controller
{
    /**
     * Listar todas las evaluaciones (con filtros opcionales)
     */
    public function all(Request $request)
    {
        $query = Evaluacion::with(['entrenado:id,nombre,apellido,foto', 'entrenador:id,nombre,apellido']);

        if ($request->has('entrenado_id')) {
            $query->where('entrenado_id', $request->entrenado_id);
        }

        if ($request->has('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        $perPage = min($request->get('per_page', 15), 100);
        $evaluaciones = $query->orderByDesc('fecha')->paginate($perPage);

        return response()->json($evaluaciones);
    }

    /**
     * Listar evaluaciones de un entrenado
     */
    public function index(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $evaluaciones = $entrenado->evaluaciones()
            ->with('entrenador:id,nombre,apellido')
            ->orderByDesc('fecha')
            ->paginate(min($request->get('per_page', 15), 100));

        return response()->json($evaluaciones);
    }

    /**
     * Crear evaluación
     */
    public function store(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $request->validate([
            'tipo' => 'required|in:vo2max,fuerza,amplitud_movimiento,flexibilidad,potencia_aerobica,potencia_anaerobica,fuerza_maxima,resistencia,aerobico,composicion,personalizado,otro',
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'valor' => 'nullable|numeric',
            'unidad' => 'nullable|string|max:50',
            'fecha' => 'required|date',
        ]);

        $evaluacion = Evaluacion::create([
            'entrenado_id' => $entrenado->id,
            'entrenador_id' => auth()->id(),
            'tipo' => $request->tipo,
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'valor' => $request->valor,
            'unidad' => $request->unidad,
            'fecha' => $request->fecha,
        ]);

        return response()->json([
            'data' => $evaluacion->load('entrenador:id,nombre,apellido'),
            'message' => 'Evaluación creada correctamente.',
        ], 201);
    }

    /**
     * Ver evaluación
     */
    public function show(Evaluacion $evaluacion)
    {
        $evaluacion->load('entrenador:id,nombre,apellido', 'entrenado:id,nombre,apellido');

        return response()->json([
            'data' => $evaluacion,
        ]);
    }

    /**
     * Actualizar evaluación
     */
    public function update(Request $request, Evaluacion $evaluacion)
    {
        if ($evaluacion->entrenador_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $request->validate([
            'tipo' => 'sometimes|required|in:vo2max,fuerza,amplitud_movimiento,flexibilidad,potencia_aerobica,potencia_anaerobica,fuerza_maxima,resistencia,aerobico,composicion,personalizado,otro',
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'valor' => 'nullable|numeric',
            'unidad' => 'nullable|string|max:50',
            'fecha' => 'sometimes|required|date',
        ]);

        $evaluacion->update($request->only([
            'tipo',
            'nombre',
            'descripcion',
            'valor',
            'unidad',
            'fecha',
        ]));

        return response()->json([
            'data' => $evaluacion,
            'message' => 'Evaluación actualizada correctamente.',
        ]);
    }

    /**
     * Eliminar evaluación
     */
    public function destroy(Evaluacion $evaluacion)
    {
        if ($evaluacion->entrenador_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $evaluacion->delete();

        return response()->json([
            'message' => 'Evaluación eliminada correctamente.',
        ]);
    }

    /**
     * Ver mis evaluaciones (para entrenados)
     */
    public function misEvaluaciones(Request $request)
    {
        $evaluaciones = $request->user()->evaluaciones()
            ->with('entrenador:id,nombre,apellido')
            ->orderByDesc('fecha')
            ->paginate(15);

        return response()->json($evaluaciones);
    }
}
