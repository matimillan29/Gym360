<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Anamnesis;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EntrenadoController extends Controller
{
    /**
     * Listar entrenados
     */
    public function index(Request $request)
    {
        $query = User::entrenados()
            ->with(['entrenadorAsignado:id,nombre,apellido', 'anamnesis'])
            ->orderBy('apellido')
            ->orderBy('nombre');

        // Filtros
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('apellido', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('dni', 'like', "%{$search}%");
            });
        }

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('entrenador_id')) {
            $query->where('entrenador_asignado_id', $request->entrenador_id);
        }

        $entrenados = $query->paginate($request->get('per_page', 15));

        return response()->json($entrenados);
    }

    /**
     * Crear entrenado
     */
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'dni' => 'required|string|max:20',
            'telefono' => 'required|string|max:50',
            'fecha_nacimiento' => 'nullable|date',
            'profesion' => 'nullable|string|max:255',
            'entrenador_asignado_id' => 'nullable|exists:users,id',
        ]);

        $entrenado = User::create([
            'email' => $request->email,
            'password' => null, // Entrenados usan OTP
            'role' => 'entrenado',
            'nombre' => $request->nombre,
            'apellido' => $request->apellido,
            'dni' => $request->dni,
            'telefono' => $request->telefono,
            'fecha_nacimiento' => $request->fecha_nacimiento,
            'profesion' => $request->profesion,
            'estado' => 'activo',
            'entrenador_asignado_id' => $request->entrenador_asignado_id ?? auth()->id(),
        ]);

        return response()->json([
            'data' => $entrenado->load('entrenadorAsignado:id,nombre,apellido'),
            'message' => 'Entrenado creado correctamente.',
        ], 201);
    }

    /**
     * Ver entrenado
     */
    public function show(User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $entrenado->load([
            'entrenadorAsignado:id,nombre,apellido',
            'anamnesis',
            'macrociclos' => function ($q) {
                $q->where('activo', true);
            },
            'cuotas' => function ($q) {
                $q->latest()->limit(5);
            },
            'evaluaciones' => function ($q) {
                $q->latest()->limit(10);
            },
            'linksAdjuntos',
            'feedbacks' => function ($q) {
                $q->latest()->limit(10);
            },
        ]);

        return response()->json([
            'data' => $entrenado,
        ]);
    }

    /**
     * Actualizar entrenado
     */
    public function update(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $request->validate([
            'email' => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($entrenado->id)],
            'nombre' => 'sometimes|required|string|max:255',
            'apellido' => 'sometimes|required|string|max:255',
            'dni' => 'sometimes|required|string|max:20',
            'telefono' => 'sometimes|required|string|max:50',
            'fecha_nacimiento' => 'nullable|date',
            'profesion' => 'nullable|string|max:255',
            'entrenador_asignado_id' => 'nullable|exists:users,id',
        ]);

        $entrenado->update($request->only([
            'email',
            'nombre',
            'apellido',
            'dni',
            'telefono',
            'fecha_nacimiento',
            'profesion',
            'entrenador_asignado_id',
        ]));

        return response()->json([
            'data' => $entrenado->load('entrenadorAsignado:id,nombre,apellido'),
            'message' => 'Entrenado actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar entrenado
     */
    public function destroy(User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $entrenado->delete();

        return response()->json([
            'message' => 'Entrenado eliminado correctamente.',
        ]);
    }

    /**
     * Dar de baja temporal
     */
    public function bajaTemporal(User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $entrenado->update(['estado' => 'baja_temporal']);

        return response()->json([
            'data' => $entrenado,
            'message' => 'Entrenado dado de baja temporalmente.',
        ]);
    }

    /**
     * Reactivar entrenado
     */
    public function reactivar(User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $entrenado->update(['estado' => 'activo']);

        return response()->json([
            'data' => $entrenado,
            'message' => 'Entrenado reactivado correctamente.',
        ]);
    }

    /**
     * Asignar entrenador
     */
    public function asignarEntrenador(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $request->validate([
            'entrenador_id' => 'required|exists:users,id',
        ]);

        // Verificar que sea un entrenador
        $entrenador = User::find($request->entrenador_id);
        if (!$entrenador->isEntrenador()) {
            return response()->json([
                'message' => 'El usuario seleccionado no es entrenador.',
            ], 400);
        }

        $entrenado->update(['entrenador_asignado_id' => $request->entrenador_id]);

        return response()->json([
            'data' => $entrenado->load('entrenadorAsignado:id,nombre,apellido'),
            'message' => 'Entrenador asignado correctamente.',
        ]);
    }

    // ===========================================
    // Métodos para entrenados (su propio perfil)
    // ===========================================

    /**
     * Ver mi perfil (para entrenados)
     */
    public function miPerfil(Request $request)
    {
        $user = $request->user();

        $user->load([
            'entrenadorAsignado:id,nombre,apellido',
            'anamnesis',
        ]);

        return response()->json([
            'data' => $user,
        ]);
    }

    /**
     * Actualizar mi perfil (para entrenados)
     */
    public function actualizarMiPerfil(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'telefono' => 'sometimes|required|string|max:50',
            'foto' => 'nullable|url',
        ]);

        $user->update($request->only([
            'telefono',
            'foto',
        ]));

        return response()->json([
            'data' => $user,
            'message' => 'Perfil actualizado correctamente.',
        ]);
    }
}
