<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Cuota;
use App\Models\Pago;
use App\Models\PlanCuota;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CuotaController extends Controller
{
    /**
     * Verificar que el usuario tiene acceso a la cuota.
     * Admins siempre tienen acceso. Entrenadores solo si el entrenado está asignado a ellos.
     */
    private function authorizeCuota(Cuota $cuota): bool
    {
        $user = auth()->user();
        if ($user->isAdmin()) {
            return true;
        }
        return $cuota->entrenado && $cuota->entrenado->entrenador_asignado_id === $user->id;
    }

    /**
     * Listar cuotas de un entrenado
     */
    public function index(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $query = $entrenado->cuotas()
            ->with('pagos', 'plan')
            ->orderByDesc('fecha_vencimiento');

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        $perPage = min($request->get('per_page', 12), 100);
        $cuotas = $query->paginate($perPage);

        return response()->json($cuotas);
    }

    /**
     * Crear cuota para un entrenado
     */
    public function store(Request $request, User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        $request->validate([
            'plan_id' => 'required|exists:planes_cuota,id',
            'monto' => 'required|numeric|min:0',
            'fecha_inicio' => 'required|date',
        ]);

        // Obtener el plan para calcular fecha de vencimiento
        $plan = PlanCuota::findOrFail($request->plan_id);
        $fechaInicio = Carbon::parse($request->fecha_inicio);
        $fechaVencimiento = $fechaInicio->copy()->addDays($plan->duracion_dias);

        $cuota = Cuota::create([
            'entrenado_id' => $entrenado->id,
            'plan_id' => $request->plan_id,
            'monto' => $request->monto,
            'fecha_inicio' => $fechaInicio,
            'fecha_vencimiento' => $fechaVencimiento,
            'estado' => 'pendiente',
        ]);

        $cuota->load('plan');

        return response()->json([
            'data' => $cuota,
            'message' => 'Cuota creada correctamente.',
        ], 201);
    }

    /**
     * Ver cuota
     */
    public function show(Cuota $cuota)
    {
        if (!$this->authorizeCuota($cuota)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $cuota->load('pagos', 'plan', 'entrenado:id,nombre,apellido');

        return response()->json([
            'data' => $cuota,
        ]);
    }

    /**
     * Actualizar cuota
     */
    public function update(Request $request, Cuota $cuota)
    {
        if (!$this->authorizeCuota($cuota)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $request->validate([
            'monto' => 'sometimes|required|numeric|min:0',
            'fecha_vencimiento' => 'sometimes|required|date',
            'estado' => 'sometimes|in:pendiente,pagado,vencido,mora',
        ]);

        $cuota->update($request->only([
            'monto',
            'fecha_vencimiento',
            'estado',
        ]));

        return response()->json([
            'data' => $cuota,
            'message' => 'Cuota actualizada correctamente.',
        ]);
    }

    /**
     * Eliminar cuota
     */
    public function destroy(Cuota $cuota)
    {
        if (!$this->authorizeCuota($cuota)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($cuota->pagos()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar una cuota con pagos registrados.',
            ], 400);
        }

        $cuota->delete();

        return response()->json([
            'message' => 'Cuota eliminada correctamente.',
        ]);
    }

    /**
     * Registrar pago de una cuota
     */
    public function registrarPago(Request $request, Cuota $cuota)
    {
        if (!$this->authorizeCuota($cuota)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'metodo' => 'required|in:efectivo,transferencia,debito,credito,otro',
            'fecha' => 'nullable|date',
            'notas' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $cuota) {
            $cuota = Cuota::lockForUpdate()->find($cuota->id);

            $pago = Pago::create([
                'cuota_id' => $cuota->id,
                'monto' => $request->monto,
                'fecha' => $request->fecha ? Carbon::parse($request->fecha) : Carbon::now(),
                'metodo' => $request->metodo,
                'notas' => $request->notas,
            ]);

            // Calcular total pagado desde la tabla de pagos
            $totalPagado = $cuota->pagos()->sum('monto');

            // Actualizar estado
            if ($totalPagado >= $cuota->monto) {
                $cuota->update(['estado' => 'pagado']);
            }

            return response()->json([
                'data' => [
                    'pago' => $pago,
                    'cuota' => $cuota->fresh(),
                ],
                'message' => 'Pago registrado correctamente.',
            ], 201);
        });
    }

    /**
     * Listar todas las cuotas (con filtros opcionales)
     */
    public function indexAll(Request $request)
    {
        $query = Cuota::with(['entrenado:id,nombre,apellido,email', 'plan', 'pagos'])
            ->orderByDesc('fecha_vencimiento');

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('entrenado_id')) {
            $query->where('entrenado_id', $request->entrenado_id);
        }

        $perPage = min($request->get('per_page', 20), 100);
        $cuotas = $query->paginate($perPage);

        return response()->json($cuotas);
    }

    /**
     * Listar pagos de una cuota
     */
    public function pagos(Cuota $cuota)
    {
        $pagos = $cuota->pagos()->orderByDesc('fecha')->get();

        return response()->json([
            'data' => $pagos,
        ]);
    }

    // ===========================================
    // Planes de cuota
    // ===========================================

    /**
     * Listar planes de cuota
     */
    public function indexPlanes(Request $request)
    {
        $planes = PlanCuota::where('activo', true)
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'data' => $planes,
        ]);
    }

    /**
     * Crear plan de cuota
     */
    public function storePlan(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'nullable|in:mensual_libre,semanal_2x,semanal_3x,pack_clases,personalizado',
            'precio' => 'required|numeric|min:0',
            'duracion_dias' => 'required|integer|min:1|max:365',
            'cantidad_accesos' => 'nullable|integer|min:1',
            'clases_semanales' => 'nullable|integer|min:1|max:7',
            'tipo_acceso' => 'nullable|in:solo_musculacion,solo_clases,completo,mixto',
        ]);

        $plan = PlanCuota::create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'tipo' => $request->tipo ?? 'personalizado',
            'precio' => $request->precio,
            'duracion_dias' => $request->duracion_dias,
            'cantidad_accesos' => $request->cantidad_accesos,
            'clases_semanales' => $request->clases_semanales,
            'tipo_acceso' => $request->tipo_acceso ?? 'completo',
            'activo' => true,
        ]);

        return response()->json([
            'data' => $plan,
            'message' => 'Plan creado correctamente.',
        ], 201);
    }

    /**
     * Actualizar plan de cuota
     */
    public function updatePlan(Request $request, PlanCuota $plan)
    {
        $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'nullable|in:mensual_libre,semanal_2x,semanal_3x,pack_clases,personalizado',
            'precio' => 'sometimes|required|numeric|min:0',
            'duracion_dias' => 'sometimes|required|integer|min:1|max:365',
            'cantidad_accesos' => 'nullable|integer|min:1',
            'clases_semanales' => 'nullable|integer|min:1|max:7',
            'tipo_acceso' => 'nullable|in:solo_musculacion,solo_clases,completo,mixto',
            'activo' => 'sometimes|boolean',
        ]);

        $plan->update($request->only([
            'nombre',
            'descripcion',
            'tipo',
            'precio',
            'duracion_dias',
            'cantidad_accesos',
            'clases_semanales',
            'tipo_acceso',
            'activo',
        ]));

        return response()->json([
            'data' => $plan,
            'message' => 'Plan actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar plan de cuota
     */
    public function destroyPlan(PlanCuota $plan)
    {
        // Soft delete - marcar como inactivo
        $plan->update(['activo' => false]);

        return response()->json([
            'message' => 'Plan desactivado correctamente.',
        ]);
    }

    // ===========================================
    // Para entrenados
    // ===========================================

    /**
     * Ver mis cuotas (para entrenados)
     */
    public function misCuotas(Request $request)
    {
        $cuotas = $request->user()->cuotas()
            ->with('pagos', 'plan')
            ->orderByDesc('fecha_vencimiento')
            ->paginate(12);

        return response()->json($cuotas);
    }
}
