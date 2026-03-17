<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\LinkAdjunto;
use Illuminate\Http\Request;

class LinkAdjuntoController extends Controller
{
    /**
     * Listar links de un entrenado
     */
    public function index(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        // Si es entrenado, solo puede ver sus propios links
        $currentUser = auth()->user();
        if ($currentUser->isEntrenado() && $currentUser->id !== $entrenado->id) {
            return response()->json([
                'message' => 'No autorizado.',
            ], 403);
        }

        $links = $entrenado->linksAdjuntos()
            ->orderBy('categoria')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $links,
        ]);
    }

    /**
     * Crear link
     */
    public function store(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $request->validate([
            'titulo' => 'required|string|max:255',
            'url' => 'required|url',
            'categoria' => 'required|in:video_tecnica,articulo,recurso,documento,app,otro',
            'descripcion' => 'nullable|string',
        ]);

        $link = LinkAdjunto::create([
            'entrenado_id' => $entrenado->id,
            'entrenador_id' => auth()->id(),
            'titulo' => $request->titulo,
            'url' => $request->url,
            'categoria' => $request->categoria,
            'descripcion' => $request->descripcion,
        ]);

        return response()->json([
            'data' => $link,
            'message' => 'Link agregado correctamente.',
        ], 201);
    }

    /**
     * Actualizar link
     */
    public function update(Request $request, LinkAdjunto $link)
    {
        $request->validate([
            'titulo' => 'sometimes|required|string|max:255',
            'url' => 'sometimes|required|url',
            'categoria' => 'sometimes|required|in:video_tecnica,articulo,recurso,documento,app,otro',
            'descripcion' => 'nullable|string',
        ]);

        $link->update($request->only([
            'titulo',
            'url',
            'categoria',
            'descripcion',
        ]));

        return response()->json([
            'data' => $link,
            'message' => 'Link actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar link
     */
    public function destroy(LinkAdjunto $link)
    {
        $link->delete();

        return response()->json([
            'message' => 'Link eliminado correctamente.',
        ]);
    }

    /**
     * Ver mis links (para entrenados)
     */
    public function misLinks(Request $request)
    {
        $links = $request->user()->linksAdjuntos()
            ->orderBy('categoria')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $links,
        ]);
    }

    /**
     * Listar todos los links (para entrenadores)
     */
    public function all(Request $request)
    {
        $query = LinkAdjunto::with(['entrenado:id,nombre,apellido,foto', 'entrenador:id,nombre,apellido']);

        if ($request->has('entrenado_id')) {
            $query->where('entrenado_id', $request->entrenado_id);
        }

        if ($request->has('categoria')) {
            $query->where('categoria', $request->categoria);
        }

        $query->orderByDesc('created_at');

        if ($request->has('per_page') || $request->has('page')) {
            $links = $query->paginate($request->get('per_page', 50));
            return response()->json($links);
        }

        $links = $query->get();

        return response()->json([
            'data' => $links,
        ]);
    }
}
