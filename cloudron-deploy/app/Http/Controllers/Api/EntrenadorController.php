<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EntrenadorController extends Controller
{
    /**
     * Listar entrenadores
     */
    public function index(Request $request)
    {
        $query = User::entrenadores()
            ->orderBy('nombre');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('apellido', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $entrenadores = $query->paginate($request->get('per_page', 15));

        return response()->json($entrenadores);
    }

    /**
     * Crear entrenador
     */
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'dni' => 'nullable|string|max:20',
            'telefono' => 'nullable|string|max:50',
        ]);

        $entrenador = User::create([
            'email' => $request->email,
            'password' => $request->password,
            'role' => 'entrenador',
            'nombre' => $request->nombre,
            'apellido' => $request->apellido,
            'dni' => $request->dni,
            'telefono' => $request->telefono,
            'estado' => 'activo',
        ]);

        return response()->json([
            'data' => $entrenador,
            'message' => 'Entrenador creado correctamente.',
        ], 201);
    }

    /**
     * Ver entrenador
     */
    public function show(User $entrenador)
    {
        if (!$entrenador->isEntrenador()) {
            return response()->json([
                'message' => 'Usuario no es entrenador.',
            ], 404);
        }

        $entrenador->load('entrenadosAsignados');

        return response()->json([
            'data' => $entrenador,
        ]);
    }

    /**
     * Actualizar entrenador
     */
    public function update(Request $request, User $entrenador)
    {
        if (!$entrenador->isEntrenador()) {
            return response()->json([
                'message' => 'Usuario no es entrenador.',
            ], 404);
        }

        $request->validate([
            'email' => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($entrenador->id)],
            'password' => 'nullable|string|min:8',
            'nombre' => 'sometimes|required|string|max:255',
            'apellido' => 'sometimes|required|string|max:255',
            'dni' => 'nullable|string|max:20',
            'telefono' => 'nullable|string|max:50',
            'estado' => 'sometimes|in:activo,inactivo',
        ]);

        $data = $request->only(['email', 'nombre', 'apellido', 'dni', 'telefono', 'estado']);

        if ($request->filled('password')) {
            $data['password'] = $request->password;
        }

        $entrenador->update($data);

        return response()->json([
            'data' => $entrenador,
            'message' => 'Entrenador actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar entrenador
     */
    public function destroy(User $entrenador)
    {
        if (!$entrenador->isEntrenador()) {
            return response()->json([
                'message' => 'Usuario no es entrenador.',
            ], 404);
        }

        if ($entrenador->isAdmin()) {
            // No permitir eliminar admins si es el único
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'No se puede eliminar el único administrador.',
                ], 400);
            }
        }

        // Reasignar entrenados a null
        User::where('entrenador_asignado_id', $entrenador->id)
            ->update(['entrenador_asignado_id' => null]);

        $entrenador->delete();

        return response()->json([
            'message' => 'Entrenador eliminado correctamente.',
        ]);
    }
}
