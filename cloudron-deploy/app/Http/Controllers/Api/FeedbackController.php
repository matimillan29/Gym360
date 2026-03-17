<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    /**
     * Listar feedbacks de un entrenado
     */
    public function index(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        // Si es el propio entrenado, solo ver los visibles
        $query = $entrenado->feedbacks()
            ->with('autor:id,nombre,apellido')
            ->orderByDesc('created_at');

        if (auth()->user()->isEntrenado()) {
            $query->where('visible_para_entrenado', true);
        }

        $feedbacks = $query->paginate($request->get('per_page', 15));

        return response()->json($feedbacks);
    }

    /**
     * Crear feedback
     */
    public function store(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $request->validate([
            'tipo' => 'required|in:general,tecnica,progreso,motivacional,nutricional,otro',
            'contenido' => 'required|string',
            'visible_para_entrenado' => 'boolean',
        ]);

        $feedback = Feedback::create([
            'user_id' => $entrenado->id,
            'autor_id' => auth()->id(),
            'tipo' => $request->tipo,
            'contenido' => $request->contenido,
            'visible_para_entrenado' => $request->visible_para_entrenado ?? true,
        ]);

        return response()->json([
            'data' => $feedback->load('autor:id,nombre,apellido'),
            'message' => 'Feedback creado correctamente.',
        ], 201);
    }

    /**
     * Actualizar feedback
     */
    public function update(Request $request, Feedback $feedback)
    {
        // Solo el autor puede editar
        if ($feedback->autor_id !== auth()->id()) {
            return response()->json([
                'message' => 'Solo el autor puede editar este feedback.',
            ], 403);
        }

        $request->validate([
            'tipo' => 'sometimes|required|in:general,tecnica,progreso,motivacional,nutricional,otro',
            'contenido' => 'sometimes|required|string',
            'visible_para_entrenado' => 'boolean',
        ]);

        $feedback->update($request->only([
            'tipo',
            'contenido',
            'visible_para_entrenado',
        ]));

        return response()->json([
            'data' => $feedback,
            'message' => 'Feedback actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar feedback
     */
    public function destroy(Feedback $feedback)
    {
        // Solo el autor puede eliminar
        if ($feedback->autor_id !== auth()->id()) {
            return response()->json([
                'message' => 'Solo el autor puede eliminar este feedback.',
            ], 403);
        }

        $feedback->delete();

        return response()->json([
            'message' => 'Feedback eliminado correctamente.',
        ]);
    }

    /**
     * Ver mis feedbacks (para entrenados)
     */
    public function misFeedbacks(Request $request)
    {
        $feedbacks = $request->user()->feedbacks()
            ->where('visible_para_entrenado', true)
            ->with('autor:id,nombre,apellido')
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json($feedbacks);
    }
}
