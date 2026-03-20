<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EntrenadorController extends Controller
{
    /**
     * Buscar entrenador por ID (admin o entrenador)
     */
    private function findEntrenador(int $id): ?User
    {
        return User::whereIn('role', ['admin', 'entrenador'])->find($id);
    }

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

        $perPage = min($request->get('per_page', 15), 100);
        $entrenadores = $query->paginate($perPage);

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
            'role' => 'sometimes|in:admin,entrenador',
        ]);

        $entrenador = User::create([
            'email' => $request->email,
            'password' => $request->password,
            'nombre' => $request->nombre,
            'apellido' => $request->apellido,
            'dni' => $request->dni,
            'telefono' => $request->telefono,
            'estado' => 'activo',
        ]);
        $entrenador->role = $request->input('role', 'entrenador');
        $entrenador->save();

        return response()->json([
            'data' => $entrenador,
            'message' => 'Entrenador creado correctamente.',
        ], 201);
    }

    /**
     * Ver entrenador
     */
    public function show(int $entrenador)
    {
        $user = $this->findEntrenador($entrenador);

        if (!$user) {
            return response()->json([
                'message' => 'Entrenador no encontrado.',
            ], 404);
        }

        $user->load('entrenadosAsignados');

        return response()->json([
            'data' => $user,
        ]);
    }

    /**
     * Actualizar entrenador
     */
    public function update(Request $request, int $entrenador)
    {
        $user = $this->findEntrenador($entrenador);

        if (!$user) {
            return response()->json([
                'message' => 'Entrenador no encontrado.',
            ], 404);
        }

        $request->validate([
            'email' => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'nombre' => 'sometimes|required|string|max:255',
            'apellido' => 'sometimes|required|string|max:255',
            'dni' => 'nullable|string|max:20',
            'telefono' => 'nullable|string|max:50',
            'estado' => 'sometimes|in:activo,inactivo',
            'role' => 'sometimes|in:admin,entrenador',
        ]);

        $data = $request->only(['email', 'nombre', 'apellido', 'dni', 'telefono', 'estado']);

        if ($request->filled('password')) {
            $data['password'] = $request->password;
        }

        $user->update($data);

        // Actualizar role explícitamente (no es fillable por seguridad)
        if ($request->filled('role')) {
            $user->role = $request->role;
            $user->save();
        }

        return response()->json([
            'data' => $user->fresh(),
            'message' => 'Entrenador actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar entrenador
     */
    public function destroy(int $entrenador)
    {
        $user = $this->findEntrenador($entrenador);

        if (!$user) {
            return response()->json([
                'message' => 'Entrenador no encontrado.',
            ], 404);
        }

        if ($user->isAdmin()) {
            // No permitir eliminar admins si es el único
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'No se puede eliminar el único administrador.',
                ], 400);
            }
        }

        // Reasignar entrenados a null
        User::where('entrenador_asignado_id', $user->id)
            ->update(['entrenador_asignado_id' => null]);

        $user->delete();

        return response()->json([
            'message' => 'Entrenador eliminado correctamente.',
        ]);
    }
}
