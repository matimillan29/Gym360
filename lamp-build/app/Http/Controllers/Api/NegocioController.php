<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Negocio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NegocioController extends Controller
{
    public function index()
    {
        $negocios = Negocio::withCount('cuponesActivos')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'data' => $negocios,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'instagram' => 'nullable|string|max:100',
            'descripcion' => 'nullable|string',
        ]);

        $negocio = Negocio::create($request->only([
            'nombre',
            'direccion',
            'telefono',
            'email',
            'instagram',
            'descripcion',
        ]));

        return response()->json([
            'data' => $negocio,
            'message' => 'Negocio creado correctamente.',
        ], 201);
    }

    public function show(Negocio $negocio)
    {
        $negocio->load('cuponesActivos');

        return response()->json([
            'data' => $negocio,
        ]);
    }

    public function update(Request $request, Negocio $negocio)
    {
        $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'instagram' => 'nullable|string|max:100',
            'descripcion' => 'nullable|string',
            'activo' => 'sometimes|boolean',
        ]);

        $negocio->update($request->only([
            'nombre',
            'direccion',
            'telefono',
            'email',
            'instagram',
            'descripcion',
            'activo',
        ]));

        return response()->json([
            'data' => $negocio,
            'message' => 'Negocio actualizado correctamente.',
        ]);
    }

    public function destroy(Negocio $negocio)
    {
        $negocio->delete();

        return response()->json([
            'message' => 'Negocio eliminado correctamente.',
        ]);
    }

    public function uploadLogo(Request $request, Negocio $negocio)
    {
        $request->validate([
            'logo' => 'required|image|max:2048',
        ]);

        // Eliminar logo anterior si existe
        if ($negocio->logo) {
            $oldPath = str_replace('/storage/', '', $negocio->logo);
            Storage::disk('public')->delete($oldPath);
        }

        // Guardar nuevo logo
        $logoPath = $request->file('logo')->store('negocios', 'public');
        $negocio->update([
            'logo' => Storage::url($logoPath),
        ]);

        return response()->json([
            'data' => $negocio,
            'message' => 'Logo actualizado correctamente.',
        ]);
    }
}
