<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ejercicio;
use Illuminate\Http\Request;

class EjercicioController extends Controller
{
    /**
     * Listar ejercicios
     */
    public function index(Request $request)
    {
        $query = Ejercicio::query();

        // Filtros
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('nombre_alternativo', 'like', "%{$search}%");
            });
        }

        if ($request->has('grupo_muscular')) {
            $query->whereJsonContains('grupos_musculares', $request->grupo_muscular);
        }

        if ($request->has('equipamiento')) {
            $query->whereJsonContains('equipamiento', $request->equipamiento);
        }

        if ($request->has('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->has('dificultad')) {
            $query->where('dificultad', $request->dificultad);
        }

        $query->orderBy('nombre');

        // Si se solicita paginación
        if ($request->has('per_page')) {
            $ejercicios = $query->paginate($request->get('per_page', 50));
        } else {
            // Para selects y búsquedas rápidas, devolver todos
            $ejercicios = $query->get();
        }

        return response()->json([
            'data' => $ejercicios,
        ]);
    }

    /**
     * Crear ejercicio
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'nombre_alternativo' => 'nullable|string|max:255',
            'descripcion' => 'nullable|string',
            'instrucciones' => 'nullable|string',
            'grupos_musculares' => 'required|array|min:1',
            'grupos_musculares.*' => 'string',
            'equipamiento' => 'nullable|array',
            'equipamiento.*' => 'string',
            'tipo' => 'required|in:fuerza,cardio,flexibilidad,potencia,resistencia',
            'dificultad' => 'required|in:principiante,intermedio,avanzado',
            'video_url' => 'nullable|url',
            'imagen_url' => 'nullable|url',
        ]);

        $ejercicio = Ejercicio::create([
            'nombre' => $request->nombre,
            'nombre_alternativo' => $request->nombre_alternativo,
            'descripcion' => $request->descripcion,
            'instrucciones' => $request->instrucciones,
            'grupos_musculares' => $request->grupos_musculares,
            'equipamiento' => $request->equipamiento ?? [],
            'tipo' => $request->tipo,
            'dificultad' => $request->dificultad,
            'video_url' => $request->video_url,
            'imagen_url' => $request->imagen_url,
            'es_personalizado' => true,
            'creado_por' => auth()->id(),
        ]);

        return response()->json([
            'data' => $ejercicio,
            'message' => 'Ejercicio creado correctamente.',
        ], 201);
    }

    /**
     * Ver ejercicio
     */
    public function show(Ejercicio $ejercicio)
    {
        return response()->json([
            'data' => $ejercicio,
        ]);
    }

    /**
     * Actualizar ejercicio
     */
    public function update(Request $request, Ejercicio $ejercicio)
    {
        // Solo se pueden editar ejercicios personalizados
        if (!$ejercicio->es_personalizado) {
            return response()->json([
                'message' => 'No se pueden editar ejercicios del sistema.',
            ], 403);
        }

        $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'nombre_alternativo' => 'nullable|string|max:255',
            'descripcion' => 'nullable|string',
            'instrucciones' => 'nullable|string',
            'grupos_musculares' => 'sometimes|required|array|min:1',
            'grupos_musculares.*' => 'string',
            'equipamiento' => 'nullable|array',
            'equipamiento.*' => 'string',
            'tipo' => 'sometimes|required|in:fuerza,cardio,flexibilidad,potencia,resistencia',
            'dificultad' => 'sometimes|required|in:principiante,intermedio,avanzado',
            'video_url' => 'nullable|url',
            'imagen_url' => 'nullable|url',
        ]);

        $ejercicio->update($request->only([
            'nombre',
            'nombre_alternativo',
            'descripcion',
            'instrucciones',
            'grupos_musculares',
            'equipamiento',
            'tipo',
            'dificultad',
            'video_url',
            'imagen_url',
        ]));

        return response()->json([
            'data' => $ejercicio,
            'message' => 'Ejercicio actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar ejercicio
     */
    public function destroy(Ejercicio $ejercicio)
    {
        // Solo se pueden eliminar ejercicios personalizados
        if (!$ejercicio->es_personalizado) {
            return response()->json([
                'message' => 'No se pueden eliminar ejercicios del sistema.',
            ], 403);
        }

        // Verificar si está siendo usado en alguna sesión
        if ($ejercicio->sesionEjercicios()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar el ejercicio porque está siendo usado en planes de entrenamiento.',
            ], 400);
        }

        $ejercicio->delete();

        return response()->json([
            'message' => 'Ejercicio eliminado correctamente.',
        ]);
    }
}
