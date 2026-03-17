<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cupon;
use App\Models\CuponEntrenado;
use App\Models\User;
use Illuminate\Http\Request;

class CuponController extends Controller
{
    /**
     * Listar todos los cupones
     */
    public function index(Request $request)
    {
        $query = Cupon::with('negocio')
            ->orderByDesc('created_at');

        if ($request->has('negocio_id')) {
            $query->where('negocio_id', $request->negocio_id);
        }

        if ($request->has('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        if ($request->has('es_cumpleanos')) {
            $query->where('es_cumpleanos', $request->boolean('es_cumpleanos'));
        }

        $cupones = $query->get();

        return response()->json([
            'data' => $cupones,
        ]);
    }

    /**
     * Crear cupón
     */
    public function store(Request $request)
    {
        $request->validate([
            'negocio_id' => 'required|exists:negocios,id',
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'codigo' => 'nullable|string|max:50',
            'tipo_descuento' => 'required|in:porcentaje,monto_fijo,especial',
            'valor_descuento' => 'nullable|numeric|min:0',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'es_cumpleanos' => 'boolean',
            'dias_validez_cumple' => 'nullable|integer|min:1|max:365',
            'usos_maximos' => 'nullable|integer|min:1',
        ]);

        $cupon = Cupon::create($request->only([
            'negocio_id',
            'titulo',
            'descripcion',
            'codigo',
            'tipo_descuento',
            'valor_descuento',
            'fecha_inicio',
            'fecha_fin',
            'es_cumpleanos',
            'dias_validez_cumple',
            'usos_maximos',
        ]));

        return response()->json([
            'data' => $cupon->load('negocio'),
            'message' => 'Cupón creado correctamente.',
        ], 201);
    }

    /**
     * Ver cupón
     */
    public function show(Cupon $cupon)
    {
        $cupon->load(['negocio', 'entrenados']);

        return response()->json([
            'data' => $cupon,
        ]);
    }

    /**
     * Actualizar cupón
     */
    public function update(Request $request, Cupon $cupon)
    {
        $request->validate([
            'titulo' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'codigo' => 'nullable|string|max:50',
            'tipo_descuento' => 'sometimes|required|in:porcentaje,monto_fijo,especial',
            'valor_descuento' => 'nullable|numeric|min:0',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date|after_or_equal:fecha_inicio',
            'es_cumpleanos' => 'boolean',
            'dias_validez_cumple' => 'nullable|integer|min:1|max:365',
            'activo' => 'sometimes|boolean',
            'usos_maximos' => 'nullable|integer|min:1',
        ]);

        $cupon->update($request->only([
            'titulo',
            'descripcion',
            'codigo',
            'tipo_descuento',
            'valor_descuento',
            'fecha_inicio',
            'fecha_fin',
            'es_cumpleanos',
            'dias_validez_cumple',
            'activo',
            'usos_maximos',
        ]));

        return response()->json([
            'data' => $cupon->load('negocio'),
            'message' => 'Cupón actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar cupón
     */
    public function destroy(Cupon $cupon)
    {
        $cupon->delete();

        return response()->json([
            'message' => 'Cupón eliminado correctamente.',
        ]);
    }

    /**
     * Asignar cupón a entrenado
     */
    public function asignar(Request $request, Cupon $cupon)
    {
        $request->validate([
            'entrenado_id' => 'required|exists:users,id',
            'fecha_vencimiento' => 'nullable|date|after:today',
            'motivo' => 'nullable|string|max:100',
        ]);

        $entrenado = User::find($request->entrenado_id);
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'El usuario no es un entrenado.',
            ], 400);
        }

        // Calcular fecha de vencimiento
        $fechaVencimiento = $request->fecha_vencimiento
            ?? ($cupon->fecha_fin ?? now()->addMonth());

        CuponEntrenado::create([
            'cupon_id' => $cupon->id,
            'entrenado_id' => $request->entrenado_id,
            'fecha_asignacion' => now(),
            'fecha_vencimiento' => $fechaVencimiento,
            'motivo' => $request->motivo ?? 'manual',
        ]);

        return response()->json([
            'message' => 'Cupón asignado correctamente.',
        ]);
    }

    /**
     * Asignar cupón a todos los entrenados activos
     */
    public function asignarATodos(Request $request, Cupon $cupon)
    {
        $request->validate([
            'fecha_vencimiento' => 'nullable|date|after:today',
            'motivo' => 'nullable|string|max:100',
        ]);

        $fechaVencimiento = $request->fecha_vencimiento
            ?? ($cupon->fecha_fin ?? now()->addMonth());

        $entrenados = User::entrenados()->where('estado', 'activo')->get();
        $asignados = 0;

        foreach ($entrenados as $entrenado) {
            // Verificar si ya tiene este cupón sin canjear
            $yaAsignado = CuponEntrenado::where('cupon_id', $cupon->id)
                ->where('entrenado_id', $entrenado->id)
                ->where('canjeado', false)
                ->exists();

            if (!$yaAsignado) {
                CuponEntrenado::create([
                    'cupon_id' => $cupon->id,
                    'entrenado_id' => $entrenado->id,
                    'fecha_asignacion' => now(),
                    'fecha_vencimiento' => $fechaVencimiento,
                    'motivo' => $request->motivo ?? 'promocion',
                ]);
                $asignados++;
            }
        }

        return response()->json([
            'message' => "Cupón asignado a {$asignados} entrenados.",
        ]);
    }

    // ======================================
    // Métodos para entrenados
    // ======================================

    /**
     * Mis cupones (para entrenados)
     */
    public function misCupones(Request $request)
    {
        $user = $request->user();

        $cupones = CuponEntrenado::with(['cupon.negocio'])
            ->where('entrenado_id', $user->id)
            ->orderByDesc('fecha_asignacion')
            ->get();

        // Separar vigentes y usados/vencidos
        $vigentes = $cupones->filter(fn($c) => $c->estaVigente());
        $otros = $cupones->filter(fn($c) => !$c->estaVigente());

        return response()->json([
            'data' => [
                'vigentes' => $vigentes->values(),
                'historial' => $otros->values(),
            ],
        ]);
    }

    /**
     * Marcar cupón como canjeado
     */
    public function canjear(Request $request, CuponEntrenado $cuponEntrenado)
    {
        $user = $request->user();

        // Si es entrenado, solo puede canjear los suyos
        if ($user->isEntrenado() && $cuponEntrenado->entrenado_id !== $user->id) {
            return response()->json([
                'message' => 'No autorizado.',
            ], 403);
        }

        if ($cuponEntrenado->canjeado) {
            return response()->json([
                'message' => 'Este cupón ya fue canjeado.',
            ], 400);
        }

        if ($cuponEntrenado->estaVencido()) {
            return response()->json([
                'message' => 'Este cupón está vencido.',
            ], 400);
        }

        $cuponEntrenado->update([
            'canjeado' => true,
            'fecha_canje' => now(),
        ]);

        return response()->json([
            'data' => $cuponEntrenado->load('cupon.negocio'),
            'message' => 'Cupón canjeado correctamente.',
        ]);
    }
}
