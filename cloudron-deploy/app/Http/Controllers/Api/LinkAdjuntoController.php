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
            'categoria' => 'required|in:video,documento,articulo,app,otro',
            'descripcion' => 'nullable|string',
        ]);

        $link = LinkAdjunto::create([
            'user_id' => $entrenado->id,
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
            'categoria' => 'sometimes|required|in:video,documento,articulo,app,otro',
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
}
