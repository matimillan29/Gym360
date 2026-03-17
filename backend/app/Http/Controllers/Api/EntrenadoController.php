<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Anamnesis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'dni' => 'required|string|max:20|unique:users,dni',
            'telefono' => 'required|string|max:50',
            'fecha_nacimiento' => 'nullable|date',
            'profesion' => 'nullable|string|max:255',
            'entrenador_asignado_id' => 'nullable|exists:users,id',
        ]);

        $entrenado = User::create([
            'email' => $request->email,
            'password' => null, // Entrenados usan OTP
            'nombre' => $request->nombre,
            'apellido' => $request->apellido,
            'dni' => $request->dni,
            'telefono' => $request->telefono,
            'fecha_nacimiento' => $request->fecha_nacimiento,
            'profesion' => $request->profesion,
            'estado' => 'activo',
            'entrenador_asignado_id' => $request->entrenador_asignado_id ?? auth()->id(),
        ]);
        $entrenado->role = 'entrenado';
        $entrenado->save();

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

        $user = auth()->user();
        if (!$user->isAdmin() && $entrenado->entrenador_asignado_id !== $user->id) {
            return response()->json(['message' => 'No autorizado para modificar este entrenado.'], 403);
        }

        $request->validate([
            'email' => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($entrenado->id)],
            'nombre' => 'sometimes|required|string|max:255',
            'apellido' => 'sometimes|required|string|max:255',
            'dni' => 'sometimes|required|string|max:20|unique:users,dni,' . $entrenado->id,
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

        $user = auth()->user();
        if (!$user->isAdmin() && $entrenado->entrenador_asignado_id !== $user->id) {
            return response()->json(['message' => 'No autorizado para modificar este entrenado.'], 403);
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

    /**
     * Toggle plan complejo/simple para un entrenado
     */
    public function togglePlanComplejo(User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json(['message' => 'Usuario no es entrenado.'], 404);
        }

        $entrenado->update(['plan_complejo' => !$entrenado->plan_complejo]);

        return response()->json([
            'data' => ['id' => $entrenado->id, 'plan_complejo' => $entrenado->plan_complejo],
            'message' => $entrenado->plan_complejo ? 'Plan complejo habilitado.' : 'Plan simple habilitado.',
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
        ]);

        $user->update($request->only([
            'telefono',
        ]));

        return response()->json([
            'data' => $user,
            'message' => 'Perfil actualizado correctamente.',
        ]);
    }

    /**
     * Subir mi foto de perfil (para entrenados)
     */
    public function uploadMiFoto(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'foto' => 'required|image|max:2048', // Max 2MB
        ]);

        // Eliminar foto anterior si existe
        if ($user->foto) {
            $oldPath = str_replace('/storage/', '', $user->foto);
            Storage::disk('public')->delete($oldPath);
        }

        // Guardar nueva foto
        $fotoPath = $request->file('foto')->store('entrenados', 'public');
        $user->update([
            'foto' => Storage::url($fotoPath),
        ]);

        return response()->json([
            'data' => $user,
            'message' => 'Foto actualizada correctamente.',
        ]);
    }

    /**
     * Subir foto del entrenado
     */
    public function uploadFoto(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $request->validate([
            'foto' => 'required|image|max:2048', // Max 2MB
        ]);

        // Eliminar foto anterior si existe
        if ($entrenado->foto) {
            $oldPath = str_replace('/storage/', '', $entrenado->foto);
            Storage::disk('public')->delete($oldPath);
        }

        // Guardar nueva foto
        $fotoPath = $request->file('foto')->store('entrenados', 'public');
        $entrenado->update([
            'foto' => Storage::url($fotoPath),
        ]);

        return response()->json([
            'data' => $entrenado,
            'message' => 'Foto actualizada correctamente.',
        ]);
    }

    // ===========================================
    // Check-in de entrenados
    // ===========================================

    /**
     * Buscar entrenado para check-in (por usuario MaMi o DNI)
     */
    public function buscarParaCheckin(Request $request)
    {
        $request->validate([
            'busqueda' => 'required|string|min:3',
        ]);

        $busqueda = $request->busqueda;

        // Buscar por DNI o por nombre/apellido
        $entrenado = User::entrenados()
            ->where(function ($q) use ($busqueda) {
                $q->where('dni', $busqueda)
                  ->orWhere('dni', 'like', "%{$busqueda}%")
                  ->orWhereRaw("CONCAT(SUBSTRING(nombre, 1, 2), SUBSTRING(apellido, 1, 2)) LIKE ?", ["%{$busqueda}%"])
                  ->orWhere('nombre', 'like', "%{$busqueda}%")
                  ->orWhere('apellido', 'like', "%{$busqueda}%");
            })
            ->first();

        if (!$entrenado) {
            return response()->json([
                'message' => 'Entrenado no encontrado.',
            ], 404);
        }

        // Cargar cuota actual
        $cuotaActual = $entrenado->cuotas()
            ->with('planCuota')
            ->orderByDesc('fecha_vencimiento')
            ->first();

        // Determinar estado de cuota
        $estadoCuota = 'sin_cuota';
        $diasRestantes = null;
        $clasesRestantes = null;

        if ($cuotaActual) {
            $hoy = now()->startOfDay();
            $vencimiento = \Carbon\Carbon::parse($cuotaActual->fecha_vencimiento)->startOfDay();
            $diasRestantes = $hoy->diffInDays($vencimiento, false);

            if ($cuotaActual->estado === 'pagado') {
                $estadoCuota = $diasRestantes >= 0 ? 'al_dia' : 'vencida';
            } elseif ($cuotaActual->estado === 'parcial') {
                $estadoCuota = 'parcial';
            } else {
                $estadoCuota = $diasRestantes >= 0 ? 'pendiente' : 'vencida';
            }

            // Si el plan tiene clases limitadas
            if ($cuotaActual->planCuota && $cuotaActual->planCuota->cantidad_accesos) {
                $clasesRestantes = max(0, $cuotaActual->planCuota->cantidad_accesos - ($cuotaActual->clases_usadas ?? 0));
            }
        }

        return response()->json([
            'data' => [
                'id' => $entrenado->id,
                'nombre' => $entrenado->nombre,
                'apellido' => $entrenado->apellido,
                'dni' => $entrenado->dni,
                'foto' => $entrenado->foto,
                'email' => $entrenado->email,
                'telefono' => $entrenado->telefono,
                'estado' => $entrenado->estado,
                'entrenador' => $entrenado->entrenadorAsignado ? [
                    'nombre' => $entrenado->entrenadorAsignado->nombre,
                    'apellido' => $entrenado->entrenadorAsignado->apellido,
                ] : null,
                'cuota' => $cuotaActual ? [
                    'id' => $cuotaActual->id,
                    'plan' => $cuotaActual->planCuota?->nombre ?? 'Sin plan',
                    'monto' => $cuotaActual->monto,
                    'monto_pagado' => $cuotaActual->total_pagado,
                    'fecha_vencimiento' => $cuotaActual->fecha_vencimiento,
                    'estado' => $estadoCuota,
                    'dias_restantes' => $diasRestantes,
                    'clases_restantes' => $clasesRestantes,
                ] : null,
            ],
        ]);
    }

    /**
     * Buscar entrenado por DNI (público, sin auth)
     */
    public function buscarPorDni(Request $request)
    {
        $request->validate([
            'dni' => 'required|string|min:3',
        ]);

        $dni = $request->dni;

        $entrenado = User::entrenados()
            ->where('dni', $dni)
            ->first();

        if (!$entrenado) {
            return response()->json([
                'message' => 'DNI no encontrado.',
            ], 404);
        }

        // Cargar cuota actual
        $cuotaActual = $entrenado->cuotas()
            ->with('planCuota')
            ->orderByDesc('fecha_vencimiento')
            ->first();

        // Determinar estado de cuota
        $estadoCuota = 'sin_cuota';
        $diasRestantes = null;
        $clasesRestantes = null;

        if ($cuotaActual) {
            $hoy = now()->startOfDay();
            $vencimiento = \Carbon\Carbon::parse($cuotaActual->fecha_vencimiento)->startOfDay();
            $diasRestantes = $hoy->diffInDays($vencimiento, false);

            if ($cuotaActual->estado === 'pagado') {
                $estadoCuota = $diasRestantes >= 0 ? 'al_dia' : 'vencida';
            } elseif ($cuotaActual->estado === 'parcial') {
                $estadoCuota = 'parcial';
            } else {
                $estadoCuota = $diasRestantes >= 0 ? 'pendiente' : 'vencida';
            }

            if ($cuotaActual->planCuota && $cuotaActual->planCuota->cantidad_accesos) {
                $clasesRestantes = max(0, $cuotaActual->planCuota->cantidad_accesos - ($cuotaActual->clases_usadas ?? 0));
            }
        }

        return response()->json([
            'data' => [
                'id' => $entrenado->id,
                'nombre' => $entrenado->nombre,
                'apellido' => $entrenado->apellido,
                'dni' => $entrenado->dni,
                'foto' => $entrenado->foto,
                'estado' => $entrenado->estado,
                'cuota' => $cuotaActual ? [
                    'id' => $cuotaActual->id,
                    'plan' => $cuotaActual->planCuota?->nombre ?? 'Sin plan',
                    'fecha_vencimiento' => $cuotaActual->fecha_vencimiento,
                    'estado' => $estadoCuota,
                    'dias_restantes' => $diasRestantes,
                    'clases_restantes' => $clasesRestantes,
                ] : null,
            ],
        ]);
    }

    /**
     * Registrar ingreso público (sin auth)
     */
    public function registrarIngresoPublico(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        if ($entrenado->estado !== 'activo') {
            return response()->json([
                'message' => 'El entrenado no está activo.',
            ], 400);
        }

        $cuotaActual = $entrenado->cuotas()
            ->with('planCuota')
            ->orderByDesc('fecha_vencimiento')
            ->first();

        $warning = null;

        if (!$cuotaActual) {
            $warning = 'Sin cuota asignada.';
        } elseif ($cuotaActual->estado === 'vencido' ||
                  (\Carbon\Carbon::parse($cuotaActual->fecha_vencimiento)->isPast() && $cuotaActual->estado !== 'pagado')) {
            $warning = 'Cuota vencida.';
        } elseif ($cuotaActual->estado === 'pendiente') {
            $warning = 'Cuota pendiente de pago.';
        }

        if ($cuotaActual && $cuotaActual->planCuota && $cuotaActual->planCuota->cantidad_accesos) {
            $clasesUsadas = $cuotaActual->clases_usadas ?? 0;
            $clasesDisponibles = $cuotaActual->planCuota->cantidad_accesos - $clasesUsadas;

            if ($clasesDisponibles <= 0) {
                return response()->json([
                    'message' => 'Sin clases disponibles.',
                ], 400);
            }

            $cuotaActual->update(['clases_usadas' => $clasesUsadas + 1]);
            $cuotaActual->refresh();
        }

        return response()->json([
            'message' => 'Ingreso registrado.',
            'warning' => $warning,
            'data' => [
                'nombre' => $entrenado->nombre . ' ' . $entrenado->apellido,
                'hora' => now()->format('H:i'),
                'clases_restantes' => $cuotaActual && $cuotaActual->planCuota && $cuotaActual->planCuota->cantidad_accesos
                    ? $cuotaActual->planCuota->cantidad_accesos - ($cuotaActual->clases_usadas ?? 0)
                    : null,
            ],
        ]);
    }

    /**
     * Registrar ingreso (check-in) del entrenado
     */
    public function registrarIngreso(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        if ($entrenado->estado !== 'activo') {
            return response()->json([
                'message' => 'El entrenado no está activo.',
            ], 400);
        }

        // Verificar cuota
        $cuotaActual = $entrenado->cuotas()
            ->with('planCuota')
            ->orderByDesc('fecha_vencimiento')
            ->first();

        $warning = null;

        if (!$cuotaActual) {
            $warning = 'El entrenado no tiene cuota asignada.';
        } elseif ($cuotaActual->estado === 'vencido' ||
                  (\Carbon\Carbon::parse($cuotaActual->fecha_vencimiento)->isPast() && $cuotaActual->estado !== 'pagado')) {
            $warning = 'La cuota está vencida.';
        } elseif ($cuotaActual->estado === 'pendiente') {
            $warning = 'La cuota aún no fue pagada.';
        }

        // Si el plan tiene clases limitadas, descontar una
        if ($cuotaActual && $cuotaActual->planCuota && $cuotaActual->planCuota->cantidad_accesos) {
            $clasesUsadas = $cuotaActual->clases_usadas ?? 0;
            $clasesDisponibles = $cuotaActual->planCuota->cantidad_accesos - $clasesUsadas;

            if ($clasesDisponibles <= 0) {
                return response()->json([
                    'message' => 'No quedan clases disponibles en el plan.',
                ], 400);
            }

            $cuotaActual->update(['clases_usadas' => $clasesUsadas + 1]);
            $cuotaActual->refresh();
        }

        // TODO: Registrar en tabla de ingresos si se quiere historial

        return response()->json([
            'message' => 'Ingreso registrado correctamente.',
            'warning' => $warning,
            'data' => [
                'nombre' => $entrenado->nombre . ' ' . $entrenado->apellido,
                'hora' => now()->format('H:i'),
                'clases_restantes' => $cuotaActual && $cuotaActual->planCuota && $cuotaActual->planCuota->cantidad_accesos
                    ? $cuotaActual->planCuota->cantidad_accesos - ($cuotaActual->clases_usadas ?? 0)
                    : null,
            ],
        ]);
    }
}
