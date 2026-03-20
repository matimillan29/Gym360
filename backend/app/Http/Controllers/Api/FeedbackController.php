<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Feedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    /**
     * Listar todos los feedbacks (para entrenadores)
     */
    public function indexAll(Request $request)
    {
        $query = Feedback::with([
            'entrenado:id,nombre,apellido,foto',
            'entrenador:id,nombre,apellido'
        ])->orderByDesc('created_at');

        // Filtros
        if ($request->filled('entrenado_id')) {
            $query->where('entrenado_id', $request->entrenado_id);
        }

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->has('privado')) {
            $privado = $request->privado === '1' || $request->privado === 'true';
            $query->where('privado', $privado);
        }

        $perPage = min($request->get('per_page', 50), 100);
        $feedbacks = $query->paginate($perPage);

        // Mapear para compatibilidad con frontend
        $feedbacks->getCollection()->transform(function ($feedback) {
            return [
                'id' => $feedback->id,
                'entrenado' => $feedback->entrenado,
                'entrenador' => $feedback->entrenador,
                'tipo' => $feedback->tipo,
                'contenido' => $feedback->contenido,
                'privado' => $feedback->privado,
                'created_at' => $feedback->created_at,
            ];
        });

        return response()->json($feedbacks);
    }

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

        // Si es entrenado, solo puede ver sus propios feedbacks
        $currentUser = auth()->user();
        if ($currentUser->isEntrenado() && $currentUser->id !== $entrenado->id) {
            return response()->json([
                'message' => 'No autorizado.',
            ], 403);
        }

        // Si es el propio entrenado, solo ver los públicos (no privados)
        $query = $entrenado->feedbacks()
            ->with('entrenador:id,nombre,apellido')
            ->orderByDesc('created_at');

        if (auth()->user()->isEntrenado()) {
            $query->where('privado', false);
        }

        $perPage = min($request->get('per_page', 15), 100);
        $feedbacks = $query->paginate($perPage);

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
            'tipo' => 'required|in:general,tecnica,progreso,motivacional,nutricional,otro,actitud,asistencia',
            'contenido' => 'required|string',
            'privado' => 'boolean',
        ]);

        $feedback = Feedback::create([
            'entrenado_id' => $entrenado->id,
            'entrenador_id' => auth()->id(),
            'tipo' => $request->tipo,
            'contenido' => $request->contenido,
            'privado' => $request->privado ?? false,
        ]);

        return response()->json([
            'data' => $feedback->load('entrenador:id,nombre,apellido'),
            'message' => 'Feedback creado correctamente.',
        ], 201);
    }

    /**
     * Actualizar feedback
     */
    public function update(Request $request, Feedback $feedback)
    {
        // Solo el autor o admin puede editar
        if ($feedback->entrenador_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json([
                'message' => 'No autorizado.',
            ], 403);
        }

        $request->validate([
            'tipo' => 'sometimes|required|in:general,tecnica,progreso,motivacional,nutricional,otro,actitud,asistencia',
            'contenido' => 'sometimes|required|string',
            'privado' => 'boolean',
        ]);

        $feedback->update($request->only(['tipo', 'contenido', 'privado']));

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
        // Solo el autor o admin puede eliminar
        if ($feedback->entrenador_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json([
                'message' => 'No autorizado.',
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
            ->where('privado', false)
            ->with('entrenador:id,nombre,apellido')
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json($feedbacks);
    }
}
