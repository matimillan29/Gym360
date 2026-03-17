<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Anamnesis;
use Illuminate\Http\Request;

class AnamnesisController extends Controller
{
    /**
     * Ver anamnesis de un entrenado
     */
    public function show(User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $anamnesis = $entrenado->anamnesis;

        if (!$anamnesis) {
            return response()->json([
                'data' => null,
                'message' => 'El entrenado no tiene anamnesis cargada.',
            ]);
        }

        return response()->json([
            'data' => $anamnesis,
        ]);
    }

    /**
     * Crear anamnesis para un entrenado
     */
    public function store(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        if ($entrenado->anamnesis) {
            return response()->json([
                'message' => 'El entrenado ya tiene anamnesis. Usá PUT para actualizar.',
            ], 400);
        }

        $data = $this->validateAnamnesis($request);
        $data['user_id'] = $entrenado->id;

        $anamnesis = Anamnesis::create($data);

        return response()->json([
            'data' => $anamnesis,
            'message' => 'Anamnesis creada correctamente.',
        ], 201);
    }

    /**
     * Actualizar anamnesis de un entrenado
     */
    public function update(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $anamnesis = $entrenado->anamnesis;

        if (!$anamnesis) {
            return response()->json([
                'message' => 'El entrenado no tiene anamnesis. Usá POST para crear.',
            ], 404);
        }

        $data = $this->validateAnamnesis($request, false);
        $anamnesis->update($data);

        return response()->json([
            'data' => $anamnesis,
            'message' => 'Anamnesis actualizada correctamente.',
        ]);
    }

    /**
     * Ver mi anamnesis (para entrenados)
     */
    public function miAnamnesis(Request $request)
    {
        $anamnesis = $request->user()->anamnesis;

        if (!$anamnesis) {
            return response()->json([
                'data' => null,
            ]);
        }

        return response()->json([
            'data' => $anamnesis,
        ]);
    }

    /**
     * Validar datos de anamnesis
     */
    private function validateAnamnesis(Request $request, bool $required = true): array
    {
        $prefix = $required ? 'required' : 'sometimes|required';

        return $request->validate([
            // Datos personales
            'altura' => ($required ? 'required' : 'nullable') . '|numeric|min:100|max:250',
            'peso' => ($required ? 'required' : 'nullable') . '|numeric|min:30|max:300',

            // Antecedentes médicos
            'enfermedades_cronicas' => 'nullable|array',
            'enfermedades_cronicas.*' => 'string',
            'medicamentos' => 'nullable|array',
            'medicamentos.*' => 'string',
            'alergias' => 'nullable|array',
            'alergias.*' => 'string',
            'cirugias' => 'nullable|array',
            'cirugias.*' => 'string',
            'lesiones' => 'nullable|array',
            'lesiones.*' => 'string',

            // Historial deportivo
            'experiencia_entrenamiento' => 'nullable|in:ninguna,principiante,intermedio,avanzado',
            'actividad_fisica_actual' => 'nullable|string',
            'frecuencia_semanal_previa' => 'nullable|integer|min:0|max:7',
            'deportes_practicados' => 'nullable|array',
            'deportes_practicados.*' => 'string',

            // Objetivos
            'objetivo_principal' => 'nullable|string|max:255',
            'objetivos_secundarios' => 'nullable|array',
            'objetivos_secundarios.*' => 'string',

            // Estilo de vida
            'horas_sueno' => 'nullable|numeric|min:0|max:24',
            'nivel_estres' => 'nullable|in:bajo,medio,alto',
            'ocupacion_activa' => 'nullable|boolean',
            'disponibilidad_dias' => 'nullable|array',
            'disponibilidad_dias.*' => 'string',
            'duracion_sesion_preferida' => 'nullable|integer|min:15|max:180',

            // Alimentación
            'tipo_alimentacion' => 'nullable|string|max:100',
            'restricciones_alimentarias' => 'nullable|array',
            'restricciones_alimentarias.*' => 'string',

            // Observaciones
            'observaciones' => 'nullable|string',
            'limitaciones_fisicas' => 'nullable|string',
        ]);
    }
}
