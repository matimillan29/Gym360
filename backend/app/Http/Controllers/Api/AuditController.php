<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    /**
     * Listar logs de auditoría con filtros (solo admin)
     */
    public function index(Request $request)
    {
        $query = AuditLog::with('user:id,nombre,apellido,role')
            ->orderByDesc('created_at');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('entity')) {
            $query->where('entity', $request->entity);
        }

        if ($request->filled('desde')) {
            $query->where('created_at', '>=', $request->desde);
        }

        if ($request->filled('hasta')) {
            $query->where('created_at', '<=', $request->hasta);
        }

        $perPage = min($request->get('per_page', 50), 100);
        $logs = $query->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Filtrar por usuario
     */
    public function byUser(Request $request, $userId)
    {
        $perPage = min($request->get('per_page', 50), 100);
        $logs = AuditLog::with('user:id,nombre,apellido,role')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Filtrar por entidad
     */
    public function byEntity(Request $request, $type, $id)
    {
        $perPage = min($request->get('per_page', 50), 100);
        $logs = AuditLog::with('user:id,nombre,apellido,role')
            ->where('entity', $type)
            ->where('entity_id', $id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($logs);
    }
}
