<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SucursalController extends Controller
{
    /**
     * Listar todas las sucursales
     */
    public function index(): JsonResponse
    {
        $sucursales = Sucursal::withCount(['usuariosPrincipales', 'clases'])
            ->orderBy('es_principal', 'desc')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sucursales,
        ]);
    }

    /**
     * Crear nueva sucursal
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'descripcion' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'es_principal' => 'nullable|boolean',
        ]);

        // Si es principal, quitar el flag de las demás
        if ($validated['es_principal'] ?? false) {
            Sucursal::where('es_principal', true)->update(['es_principal' => false]);
        }

        $sucursal = Sucursal::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Sucursal creada exitosamente',
            'data' => $sucursal,
        ], 201);
    }

    /**
     * Ver una sucursal específica
     */
    public function show(Sucursal $sucursal): JsonResponse
    {
        $sucursal->loadCount(['usuariosPrincipales', 'clases']);

        return response()->json([
            'success' => true,
            'data' => $sucursal,
        ]);
    }

    /**
     * Actualizar sucursal
     */
    public function update(Request $request, Sucursal $sucursal): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'descripcion' => 'nullable|string',
            'color' => 'nullable|string|max:7',
            'activa' => 'nullable|boolean',
            'es_principal' => 'nullable|boolean',
        ]);

        // Si es principal, quitar el flag de las demás
        if ($validated['es_principal'] ?? false) {
            Sucursal::where('id', '!=', $sucursal->id)
                ->where('es_principal', true)
                ->update(['es_principal' => false]);
        }

        $sucursal->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Sucursal actualizada exitosamente',
            'data' => $sucursal,
        ]);
    }

    /**
     * Eliminar sucursal
     */
    public function destroy(Sucursal $sucursal): JsonResponse
    {
        if ($sucursal->es_principal) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar la sucursal principal',
            ], 400);
        }

        // Verificar si hay usuarios o clases asociados
        if ($sucursal->usuariosPrincipales()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Hay usuarios asociados a esta sucursal. Reasignalos antes de eliminar.',
            ], 400);
        }

        $sucursal->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sucursal eliminada exitosamente',
        ]);
    }

    /**
     * Listar usuarios de una sucursal
     */
    public function usuarios(Sucursal $sucursal): JsonResponse
    {
        // Usuarios con esta sucursal como principal
        $principales = $sucursal->usuariosPrincipales()
            ->select('id', 'nombre', 'apellido', 'email', 'role')
            ->get()
            ->map(fn($u) => array_merge($u->toArray(), ['tipo_acceso' => 'principal']));

        // Usuarios con acceso adicional
        $adicionales = $sucursal->usuarios()
            ->select('users.id', 'nombre', 'apellido', 'email', 'role')
            ->get()
            ->map(fn($u) => array_merge($u->toArray(), ['tipo_acceso' => 'adicional']));

        // Combinar y eliminar duplicados por ID
        $todos = collect($principales)->merge($adicionales)->unique('id')->values();

        return response()->json([
            'success' => true,
            'data' => $todos,
        ]);
    }

    /**
     * Agregar acceso a sucursal para un usuario
     */
    public function agregarUsuario(Request $request, Sucursal $sucursal): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'es_principal' => 'nullable|boolean',
        ]);

        $user = User::findOrFail($validated['user_id']);

        if ($validated['es_principal'] ?? false) {
            // Establecer como sucursal principal
            $user->update(['sucursal_id' => $sucursal->id]);
        } else {
            // Agregar acceso adicional
            $sucursal->usuarios()->syncWithoutDetaching([$user->id]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Usuario agregado a la sucursal',
        ]);
    }

    /**
     * Quitar acceso a sucursal para un usuario
     */
    public function quitarUsuario(Request $request, Sucursal $sucursal): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($validated['user_id']);

        // Si es su sucursal principal, quitarla
        if ($user->sucursal_id == $sucursal->id) {
            $user->update(['sucursal_id' => null]);
        }

        // Quitar de accesos adicionales
        $sucursal->usuarios()->detach($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Usuario removido de la sucursal',
        ]);
    }

    /**
     * Obtener sucursales activas (para selectores)
     */
    public function activas(): JsonResponse
    {
        $sucursales = Sucursal::where('activa', true)
            ->orderBy('es_principal', 'desc')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'color', 'es_principal']);

        return response()->json([
            'success' => true,
            'data' => $sucursales,
        ]);
    }
}
