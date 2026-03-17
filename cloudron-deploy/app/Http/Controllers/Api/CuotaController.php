<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Cuota;
use App\Models\Pago;
use App\Models\PlanCuota;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CuotaController extends Controller
{
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
            ->with('pagos', 'planCuota')
            ->orderByDesc('fecha_vencimiento');

        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        $cuotas = $query->paginate($request->get('per_page', 12));

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
            'plan_cuota_id' => 'nullable|exists:planes_cuota,id',
            'monto' => 'required|numeric|min:0',
            'fecha_vencimiento' => 'required|date',
            'descripcion' => 'nullable|string|max:255',
        ]);

        $cuota = Cuota::create([
            'user_id' => $entrenado->id,
            'plan_cuota_id' => $request->plan_cuota_id,
            'monto' => $request->monto,
            'monto_pagado' => 0,
            'fecha_vencimiento' => $request->fecha_vencimiento,
            'estado' => 'pendiente',
            'descripcion' => $request->descripcion,
        ]);

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
        $cuota->load('pagos', 'planCuota', 'user:id,nombre,apellido');

        return response()->json([
            'data' => $cuota,
        ]);
    }

    /**
     * Actualizar cuota
     */
    public function update(Request $request, Cuota $cuota)
    {
        $request->validate([
            'monto' => 'sometimes|required|numeric|min:0',
            'fecha_vencimiento' => 'sometimes|required|date',
            'descripcion' => 'nullable|string|max:255',
            'estado' => 'sometimes|in:pendiente,pagada,parcial,vencida',
        ]);

        $cuota->update($request->only([
            'monto',
            'fecha_vencimiento',
            'descripcion',
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
        $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'metodo_pago' => 'required|in:efectivo,transferencia,tarjeta,mercadopago,otro',
            'notas' => 'nullable|string',
        ]);

        $pago = Pago::create([
            'cuota_id' => $cuota->id,
            'monto' => $request->monto,
            'fecha_pago' => Carbon::now(),
            'metodo_pago' => $request->metodo_pago,
            'notas' => $request->notas,
        ]);

        // Actualizar monto pagado en la cuota
        $cuota->monto_pagado += $request->monto;

        // Actualizar estado
        if ($cuota->monto_pagado >= $cuota->monto) {
            $cuota->estado = 'pagada';
            $cuota->fecha_pago = Carbon::now();
        } else {
            $cuota->estado = 'parcial';
        }

        $cuota->save();

        return response()->json([
            'data' => [
                'pago' => $pago,
                'cuota' => $cuota,
            ],
            'message' => 'Pago registrado correctamente.',
        ], 201);
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
            'precio' => 'required|numeric|min:0',
            'duracion_dias' => 'required|integer|min:1|max:365',
            'sesiones_semanales' => 'nullable|integer|min:1|max:7',
        ]);

        $plan = PlanCuota::create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'precio' => $request->precio,
            'duracion_dias' => $request->duracion_dias,
            'sesiones_semanales' => $request->sesiones_semanales,
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
            'precio' => 'sometimes|required|numeric|min:0',
            'duracion_dias' => 'sometimes|required|integer|min:1|max:365',
            'sesiones_semanales' => 'nullable|integer|min:1|max:7',
            'activo' => 'sometimes|boolean',
        ]);

        $plan->update($request->only([
            'nombre',
            'descripcion',
            'precio',
            'duracion_dias',
            'sesiones_semanales',
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
            ->with('pagos', 'planCuota')
            ->orderByDesc('fecha_vencimiento')
            ->paginate(12);

        return response()->json($cuotas);
    }
}
