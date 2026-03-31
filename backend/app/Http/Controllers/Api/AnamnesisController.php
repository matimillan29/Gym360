<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Anamnesis;
use Illuminate\Http\Request;

class AnamnesisController extends Controller
{
    /**
     * Verificar que el entrenador autenticado es dueño del entrenado
     */
    private function authorizeEntrenado(User $entrenado): bool
    {
        $user = auth()->user();
        if ($user->isAdmin()) return true;
        return $entrenado->entrenador_asignado_id === $user->id;
    }

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

        if (!$this->authorizeEntrenado($entrenado)) {
            return response()->json(['message' => 'No autorizado.'], 403);
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

        if (!$this->authorizeEntrenado($entrenado)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($entrenado->anamnesis) {
            return response()->json([
                'message' => 'El entrenado ya tiene anamnesis. Usá PUT para actualizar.',
            ], 400);
        }

        $data = $this->validateAnamnesis($request);
        $data['entrenado_id'] = $entrenado->id;

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

        if (!$this->authorizeEntrenado($entrenado)) {
            return response()->json(['message' => 'No autorizado.'], 403);
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
        return $request->validate([
            // Datos antropométricos
            'peso' => 'nullable|numeric|min:30|max:300',
            'altura' => 'nullable|numeric|min:100|max:250',
            'medidas' => 'nullable|array',
            'medidas.hombros' => 'nullable|numeric',
            'medidas.torax' => 'nullable|numeric',
            'medidas.cintura' => 'nullable|numeric',
            'medidas.cadera' => 'nullable|numeric',
            'medidas.muslo_derecho' => 'nullable|numeric',
            'medidas.muslo_izquierdo' => 'nullable|numeric',
            'medidas.gemelo_derecho' => 'nullable|numeric',
            'medidas.gemelo_izquierdo' => 'nullable|numeric',
            'medidas.brazo_derecho' => 'nullable|numeric',
            'medidas.brazo_izquierdo' => 'nullable|numeric',

            // Historial médico
            'lesiones_previas' => 'nullable|string',
            'lesiones_actuales' => 'nullable|string',
            'cirugias' => 'nullable|string',
            'molestias' => 'nullable|string',
            'condiciones_medicas' => 'nullable|string',
            'medicacion' => 'nullable|string',
            'alergias' => 'nullable|string',

            // Historial deportivo
            'experiencia_gym' => 'nullable|string',
            'años_entrenamiento' => 'nullable|integer|min:0',
            'deportes' => 'nullable|string',
            'frecuencia_actual' => 'nullable|string',
            'objetivos_principales' => 'nullable|string',
            'objetivos_secundarios' => 'nullable|string',
            'icono_objetivo' => 'nullable|string|max:50',
            'disponibilidad_dias' => 'nullable|integer|min:1|max:7',
            'tiempo_por_sesion' => 'nullable|string',

            // Condicionantes
            'ejercicios_contraindicados' => 'nullable|string',
            'limitaciones_movimiento' => 'nullable|string',
            'equipamiento_casa' => 'nullable|string',
            'notas' => 'nullable|string',
        ]);
    }
}
