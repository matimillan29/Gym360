<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Cuota;
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
            ->with([
                'entrenadorAsignado:id,nombre,apellido',
                'anamnesis',
                'macrociclos' => fn($q) => $q->where('activo', true)->select('id', 'entrenado_id', 'nombre'),
                'cuotas' => fn($q) => $q->orderByDesc('fecha_vencimiento')->limit(1)->select('id', 'entrenado_id', 'estado', 'fecha_vencimiento'),
            ])
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

        $perPage = min($request->get('per_page', $request->get('limit', 15)), 100);
        $entrenados = $query->paginate($perPage);

        // Derivar campos de las relaciones ya cargadas (sin queries extra)
        $entrenados->getCollection()->transform(function ($entrenado) {
            $entrenado->plan_activo_nombre = $entrenado->macrociclos->first()?->nombre;
            $entrenado->estado_cuota = $entrenado->cuotas->first()?->estado ?? 'sin_cuota';
            unset($entrenado->macrociclos, $entrenado->cuotas);
            return $entrenado;
        });

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
            'plan_cuota_id' => 'nullable|exists:planes_cuota,id',
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
            'plan_cuota_id' => $request->plan_cuota_id,
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
            'planCuota:id,nombre,precio',
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
            'plan_cuota_id' => 'nullable|exists:planes_cuota,id',
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
            'plan_cuota_id',
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

        $user = auth()->user();
        if (!$user->isAdmin() && $entrenado->entrenador_asignado_id !== $user->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
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

        $user = auth()->user();
        if (!$user->isAdmin() && $entrenado->entrenador_asignado_id !== $user->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
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
     * Validar acceso del entrenado según su cuota y plan
     * Retorna [allowed, warning, cuota, clasesRestantes]
     */
    private function validarAcceso(User $entrenado): array
    {
        $cuotaActual = $entrenado->cuotas()
            ->with('plan')
            ->orderByDesc('fecha_vencimiento')
            ->first();

        if (!$cuotaActual) {
            return [false, 'Sin cuota asignada.', null, null];
        }

        $plan = $cuotaActual->plan;
        $vencida = \Carbon\Carbon::parse($cuotaActual->fecha_vencimiento)->isPast();

        // Bloquear si cuota vencida
        if ($vencida && $cuotaActual->estado !== 'pagado') {
            return [false, 'Cuota vencida. Contactá a tu entrenador para renovar.', $cuotaActual, null];
        }
        if ($cuotaActual->estado === 'vencido' || $cuotaActual->estado === 'mora') {
            return [false, 'Cuota vencida. Contactá a tu entrenador para renovar.', $cuotaActual, null];
        }

        // Warning si pendiente (pero permite acceso)
        $warning = null;
        if ($cuotaActual->estado === 'pendiente') {
            $warning = 'Cuota pendiente de pago.';
        }

        // Validar según tipo de plan
        if ($plan) {
            $tipo = $plan->tipo;

            // Pack de clases: verificar accesos restantes
            if ($tipo === 'pack_clases' && $plan->cantidad_accesos) {
                $clasesUsadas = $cuotaActual->clases_usadas ?? 0;
                $clasesRestantes = $plan->cantidad_accesos - $clasesUsadas;
                if ($clasesRestantes <= 0) {
                    return [false, 'Sin accesos restantes en tu pack.', $cuotaActual, 0];
                }
                return [true, $warning, $cuotaActual, $clasesRestantes];
            }

            // Semanal 2x/3x: verificar límite semanal
            if (in_array($tipo, ['semanal_2x', 'semanal_3x'])) {
                $limiteHoy = $tipo === 'semanal_2x' ? 2 : 3;
                $inicioSemana = now()->startOfWeek(\Carbon\Carbon::MONDAY);
                $finSemana = now()->endOfWeek(\Carbon\Carbon::SUNDAY);

                try {
                    $ingresosEstaSemana = \App\Models\Ingreso::where('entrenado_id', $entrenado->id)
                        ->whereBetween('fecha_entrada', [$inicioSemana, $finSemana])
                        ->count();
                } catch (\Throwable $e) {
                    $ingresosEstaSemana = 0;
                }

                if ($ingresosEstaSemana >= $limiteHoy) {
                    return [false, "Ya usaste tus {$limiteHoy} accesos de esta semana.", $cuotaActual, 0];
                }
                return [true, $warning, $cuotaActual, $limiteHoy - $ingresosEstaSemana];
            }

            // Personalizado con cantidad_accesos: verificar total
            if ($tipo === 'personalizado' && $plan->cantidad_accesos) {
                $clasesUsadas = $cuotaActual->clases_usadas ?? 0;
                $clasesRestantes = $plan->cantidad_accesos - $clasesUsadas;
                if ($clasesRestantes <= 0) {
                    return [false, 'Sin accesos restantes.', $cuotaActual, 0];
                }
                return [true, $warning, $cuotaActual, $clasesRestantes];
            }
        }

        // mensual_libre o sin restricción: acceso ilimitado
        return [true, $warning, $cuotaActual, null];
    }

    /**
     * Registrar un ingreso y actualizar contadores
     */
    private function crearIngreso(User $entrenado, ?Cuota $cuota): ?\App\Models\Ingreso
    {
        try {
            $ingreso = \App\Models\Ingreso::create([
                'entrenado_id' => $entrenado->id,
                'cuota_id' => $cuota?->id,
                'fecha_entrada' => now(),
                'tipo' => 'musculacion',
            ]);
        } catch (\Throwable $e) {
            // Tabla ingresos puede no existir - continuar sin registrar
            \Log::warning('crearIngreso: tabla no existe - ' . $e->getMessage());
            $ingreso = null;
        }

        // Incrementar clases_usadas para planes con accesos limitados
        if ($cuota && $cuota->plan) {
            $tipo = $cuota->plan->tipo;
            if (in_array($tipo, ['pack_clases', 'personalizado']) && $cuota->plan->cantidad_accesos) {
                $cuota->increment('clases_usadas');
            }
        }

        return $ingreso;
    }

    /**
     * Registrar ingreso público (sin auth)
     */
    public function registrarIngresoPublico(Request $request, User $entrenado)
    {
        try {
            if (!$entrenado->isEntrenado()) {
                return response()->json(['message' => 'Usuario no es entrenado.'], 404);
            }

            if ($entrenado->estado !== 'activo') {
                return response()->json(['message' => 'El entrenado no está activo.'], 400);
            }

            [$allowed, $warning, $cuota, $clasesRestantes] = $this->validarAcceso($entrenado);

            if (!$allowed) {
                return response()->json(['message' => $warning], 400);
            }

            $ingreso = $this->crearIngreso($entrenado, $cuota);

            if ($clasesRestantes !== null) {
                $clasesRestantes = max(0, $clasesRestantes - 1);
            }

            return response()->json([
                'message' => 'Ingreso registrado.',
                'warning' => $warning,
                'data' => [
                    'nombre' => $entrenado->nombre . ' ' . $entrenado->apellido,
                    'hora' => now()->format('H:i'),
                    'ingreso_id' => $ingreso?->id,
                    'clases_restantes' => $clasesRestantes,
                ],
            ]);
        } catch (\Throwable $e) {
            \Log::error('registrarIngresoPublico error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al registrar ingreso: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Registrar ingreso (check-in) del entrenado
     */
    public function registrarIngreso(Request $request, User $entrenado)
    {
        try {
            if (!$entrenado->isEntrenado()) {
                return response()->json(['message' => 'Usuario no es entrenado.'], 404);
            }

            if ($entrenado->estado !== 'activo') {
                return response()->json(['message' => 'El entrenado no está activo.'], 400);
            }

            [$allowed, $warning, $cuota, $clasesRestantes] = $this->validarAcceso($entrenado);

            if (!$allowed) {
                return response()->json(['message' => $warning], 400);
            }

            $ingreso = $this->crearIngreso($entrenado, $cuota);

            if ($clasesRestantes !== null) {
                $clasesRestantes = max(0, $clasesRestantes - 1);
            }

            return response()->json([
                'message' => 'Ingreso registrado correctamente.',
                'warning' => $warning,
                'data' => [
                    'nombre' => $entrenado->nombre . ' ' . $entrenado->apellido,
                    'hora' => now()->format('H:i'),
                    'ingreso_id' => $ingreso?->id,
                    'clases_restantes' => $clasesRestantes,
                ],
        ]);
        } catch (\Throwable $e) {
            \Log::error('registrarIngreso error: ' . $e->getMessage(), [
                'entrenado_id' => $entrenado->id,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Error al registrar ingreso: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Registrar salida (check-out) del entrenado
     */
    public function registrarSalida(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json(['message' => 'Usuario no es entrenado.'], 404);
        }

        // Buscar el ingreso abierto más reciente (sin fecha_salida)
        try {
            $ingreso = \App\Models\Ingreso::where('entrenado_id', $entrenado->id)
                ->whereNull('fecha_salida')
                ->orderByDesc('fecha_entrada')
                ->first();
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Sistema de ingresos no disponible.'], 400);
        }

        if (!$ingreso) {
            return response()->json(['message' => 'No se encontró un ingreso activo.'], 404);
        }

        $ahora = now();
        $duracion = $ingreso->fecha_entrada->diffInMinutes($ahora);

        $ingreso->update([
            'fecha_salida' => $ahora,
            'duracion_minutos' => $duracion,
        ]);

        return response()->json([
            'message' => 'Salida registrada correctamente.',
            'data' => [
                'nombre' => $entrenado->nombre . ' ' . $entrenado->apellido,
                'hora_entrada' => $ingreso->fecha_entrada->format('H:i'),
                'hora_salida' => $ahora->format('H:i'),
                'duracion_minutos' => $duracion,
            ],
        ]);
    }

    /**
     * Cerrar automáticamente ingresos abiertos hace más de 3 horas
     */
    private function autoCheckout(): void
    {
        try {
            $limite = now()->subHours(3);
            \App\Models\Ingreso::whereNull('fecha_salida')
                ->where('fecha_entrada', '<', $limite)
                ->each(function ($ingreso) {
                    $salida = $ingreso->fecha_entrada->copy()->addHours(3);
                    $ingreso->update([
                        'fecha_salida' => $salida,
                        'duracion_minutos' => 180,
                        'observaciones' => 'Checkout automático (3hs)',
                    ]);
                });
        } catch (\Throwable $e) {
            // Tabla ingresos puede no existir aún
            \Log::warning('autoCheckout: ' . $e->getMessage());
        }
    }

    /**
     * Listar ingresos de hoy (para CheckinGestion)
     */
    public function ingresosHoy(Request $request)
    {
        // Auto-cerrar ingresos viejos
        $this->autoCheckout();

        try {
        $ingresos = \App\Models\Ingreso::with('entrenado:id,nombre,apellido,foto,dni')
            ->whereDate('fecha_entrada', today())
            ->orderByDesc('fecha_entrada')
            ->get()
            ->map(fn($i) => [
                'id' => $i->id,
                'entrenado' => $i->entrenado ? [
                    'id' => $i->entrenado->id,
                    'nombre' => $i->entrenado->nombre,
                    'apellido' => $i->entrenado->apellido,
                    'foto' => $i->entrenado->foto,
                    'dni' => $i->entrenado->dni,
                ] : null,
                'hora_entrada' => $i->fecha_entrada->format('H:i'),
                'hora_salida' => $i->fecha_salida?->format('H:i'),
                'duracion_minutos' => $i->duracion_minutos,
                'activo' => $i->fecha_salida === null,
            ]);

        return response()->json(['data' => $ingresos]);
        } catch (\Throwable $e) {
            // Tabla ingresos puede no existir
            return response()->json(['data' => []]);
        }
    }

    /**
     * Historial de ingresos con filtros
     */
    public function ingresosHistorial(Request $request)
    {
        try {
        $query = \App\Models\Ingreso::with('entrenado:id,nombre,apellido,dni');

        if ($request->filled('entrenado_id')) {
            $query->where('entrenado_id', $request->entrenado_id);
        }
        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha_entrada', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha_entrada', '<=', $request->fecha_hasta);
        }

        $perPage = min($request->get('per_page', 20), 100);
        $ingresos = $query->orderByDesc('fecha_entrada')
            ->paginate($perPage);

        return response()->json($ingresos);
        } catch (\Throwable $e) {
            return response()->json(['data' => [], 'meta' => ['total' => 0]]);
        }
    }

    /**
     * Resumen de asistencia de un entrenado (para EntrenadoDetalle)
     */
    public function asistencia(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json(['message' => 'Usuario no es entrenado.'], 404);
        }

        $mes = $request->get('mes', now()->format('Y-m'));
        $inicioMes = \Carbon\Carbon::parse($mes . '-01')->startOfMonth();
        $finMes = $inicioMes->copy()->endOfMonth();

        // Ingresos del mes
        try {
            $ingresosMes = \App\Models\Ingreso::where('entrenado_id', $entrenado->id)
                ->whereBetween('fecha_entrada', [$inicioMes, $finMes])
                ->orderByDesc('fecha_entrada')
                ->get();
        } catch (\Throwable $e) {
            $ingresosMes = collect();
        }

        // Calcular accesos según plan
        $cuotaActual = $entrenado->cuotas()
            ->with('plan')
            ->orderByDesc('fecha_vencimiento')
            ->first();

        $accesosPermitidos = null;
        $tipoAcceso = null;
        if ($cuotaActual && $cuotaActual->plan) {
            $plan = $cuotaActual->plan;
            $tipoAcceso = $plan->tipo;
            if ($plan->tipo === 'pack_clases' && $plan->cantidad_accesos) {
                $accesosPermitidos = $plan->cantidad_accesos;
            } elseif (in_array($plan->tipo, ['semanal_2x', 'semanal_3x'])) {
                $porSemana = $plan->tipo === 'semanal_2x' ? 2 : 3;
                // Semanas en el mes ≈ 4.3
                $accesosPermitidos = (int) round($porSemana * 4.3);
            }
        }

        $totalMes = $ingresosMes->count();
        $duracionPromedio = $ingresosMes->whereNotNull('duracion_minutos')->avg('duracion_minutos');

        return response()->json([
            'data' => [
                'mes' => $mes,
                'total_asistencias' => $totalMes,
                'accesos_permitidos' => $accesosPermitidos,
                'tipo_plan' => $tipoAcceso,
                'accesos_restantes' => $accesosPermitidos ? max(0, $accesosPermitidos - $totalMes) : null,
                'duracion_promedio_min' => $duracionPromedio ? (int) round($duracionPromedio) : null,
                'cuota_estado' => $cuotaActual?->estado,
                'ingresos' => $ingresosMes->map(fn($i) => [
                    'id' => $i->id,
                    'fecha' => $i->fecha_entrada->format('Y-m-d'),
                    'hora_entrada' => $i->fecha_entrada->format('H:i'),
                    'hora_salida' => $i->fecha_salida?->format('H:i'),
                    'duracion_minutos' => $i->duracion_minutos,
                    'auto_checkout' => str_contains($i->observaciones ?? '', 'automático'),
                ]),
            ],
        ]);
    }
}
