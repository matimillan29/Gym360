<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Evaluacion;
use Illuminate\Http\Request;

class EvaluacionController extends Controller
{
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
            ->with('evaluador:id,nombre,apellido')
            ->orderByDesc('fecha')
            ->paginate($request->get('per_page', 15));

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
            'tipo' => 'required|in:inicial,seguimiento,final',
            'fecha' => 'required|date',

            // Medidas antropométricas
            'peso' => 'nullable|numeric|min:20|max:300',
            'altura' => 'nullable|numeric|min:100|max:250',
            'grasa_corporal' => 'nullable|numeric|min:1|max:60',
            'masa_muscular' => 'nullable|numeric|min:10|max:100',

            // Perímetros
            'perimetro_pecho' => 'nullable|numeric|min:50|max:200',
            'perimetro_cintura' => 'nullable|numeric|min:40|max:200',
            'perimetro_cadera' => 'nullable|numeric|min:50|max:200',
            'perimetro_brazo_derecho' => 'nullable|numeric|min:15|max:60',
            'perimetro_brazo_izquierdo' => 'nullable|numeric|min:15|max:60',
            'perimetro_muslo_derecho' => 'nullable|numeric|min:30|max:100',
            'perimetro_muslo_izquierdo' => 'nullable|numeric|min:30|max:100',
            'perimetro_pantorrilla_derecha' => 'nullable|numeric|min:20|max:60',
            'perimetro_pantorrilla_izquierda' => 'nullable|numeric|min:20|max:60',

            // Tests de rendimiento
            'test_fuerza' => 'nullable|array',
            'test_resistencia' => 'nullable|array',
            'test_flexibilidad' => 'nullable|array',
            'test_potencia' => 'nullable|array',

            // Otros
            'fotos' => 'nullable|array',
            'fotos.*' => 'url',
            'observaciones' => 'nullable|string',
            'recomendaciones' => 'nullable|string',
        ]);

        $evaluacion = Evaluacion::create([
            'user_id' => $entrenado->id,
            'evaluador_id' => auth()->id(),
            'tipo' => $request->tipo,
            'fecha' => $request->fecha,
            'peso' => $request->peso,
            'altura' => $request->altura,
            'grasa_corporal' => $request->grasa_corporal,
            'masa_muscular' => $request->masa_muscular,
            'perimetro_pecho' => $request->perimetro_pecho,
            'perimetro_cintura' => $request->perimetro_cintura,
            'perimetro_cadera' => $request->perimetro_cadera,
            'perimetro_brazo_derecho' => $request->perimetro_brazo_derecho,
            'perimetro_brazo_izquierdo' => $request->perimetro_brazo_izquierdo,
            'perimetro_muslo_derecho' => $request->perimetro_muslo_derecho,
            'perimetro_muslo_izquierdo' => $request->perimetro_muslo_izquierdo,
            'perimetro_pantorrilla_derecha' => $request->perimetro_pantorrilla_derecha,
            'perimetro_pantorrilla_izquierda' => $request->perimetro_pantorrilla_izquierda,
            'test_fuerza' => $request->test_fuerza,
            'test_resistencia' => $request->test_resistencia,
            'test_flexibilidad' => $request->test_flexibilidad,
            'test_potencia' => $request->test_potencia,
            'fotos' => $request->fotos,
            'observaciones' => $request->observaciones,
            'recomendaciones' => $request->recomendaciones,
        ]);

        return response()->json([
            'data' => $evaluacion->load('evaluador:id,nombre,apellido'),
            'message' => 'Evaluación creada correctamente.',
        ], 201);
    }

    /**
     * Ver evaluación
     */
    public function show(Evaluacion $evaluacion)
    {
        $evaluacion->load('evaluador:id,nombre,apellido', 'user:id,nombre,apellido');

        return response()->json([
            'data' => $evaluacion,
        ]);
    }

    /**
     * Actualizar evaluación
     */
    public function update(Request $request, Evaluacion $evaluacion)
    {
        $request->validate([
            'tipo' => 'sometimes|required|in:inicial,seguimiento,final',
            'fecha' => 'sometimes|required|date',
            'peso' => 'nullable|numeric|min:20|max:300',
            'altura' => 'nullable|numeric|min:100|max:250',
            'grasa_corporal' => 'nullable|numeric|min:1|max:60',
            'masa_muscular' => 'nullable|numeric|min:10|max:100',
            'perimetro_pecho' => 'nullable|numeric|min:50|max:200',
            'perimetro_cintura' => 'nullable|numeric|min:40|max:200',
            'perimetro_cadera' => 'nullable|numeric|min:50|max:200',
            'perimetro_brazo_derecho' => 'nullable|numeric|min:15|max:60',
            'perimetro_brazo_izquierdo' => 'nullable|numeric|min:15|max:60',
            'perimetro_muslo_derecho' => 'nullable|numeric|min:30|max:100',
            'perimetro_muslo_izquierdo' => 'nullable|numeric|min:30|max:100',
            'perimetro_pantorrilla_derecha' => 'nullable|numeric|min:20|max:60',
            'perimetro_pantorrilla_izquierda' => 'nullable|numeric|min:20|max:60',
            'test_fuerza' => 'nullable|array',
            'test_resistencia' => 'nullable|array',
            'test_flexibilidad' => 'nullable|array',
            'test_potencia' => 'nullable|array',
            'fotos' => 'nullable|array',
            'fotos.*' => 'url',
            'observaciones' => 'nullable|string',
            'recomendaciones' => 'nullable|string',
        ]);

        $evaluacion->update($request->only([
            'tipo',
            'fecha',
            'peso',
            'altura',
            'grasa_corporal',
            'masa_muscular',
            'perimetro_pecho',
            'perimetro_cintura',
            'perimetro_cadera',
            'perimetro_brazo_derecho',
            'perimetro_brazo_izquierdo',
            'perimetro_muslo_derecho',
            'perimetro_muslo_izquierdo',
            'perimetro_pantorrilla_derecha',
            'perimetro_pantorrilla_izquierda',
            'test_fuerza',
            'test_resistencia',
            'test_flexibilidad',
            'test_potencia',
            'fotos',
            'observaciones',
            'recomendaciones',
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
            ->with('evaluador:id,nombre,apellido')
            ->orderByDesc('fecha')
            ->paginate(15);

        return response()->json($evaluaciones);
    }
}
