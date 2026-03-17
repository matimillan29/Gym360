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
            ->orderByDesc('timestamp');

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
            $query->where('timestamp', '>=', $request->desde);
        }

        if ($request->filled('hasta')) {
            $query->where('timestamp', '<=', $request->hasta);
        }

        $logs = $query->paginate($request->get('per_page', 50));

        return response()->json($logs);
    }

    /**
     * Filtrar por usuario
     */
    public function byUser(Request $request, $userId)
    {
        $logs = AuditLog::with('user:id,nombre,apellido,role')
            ->where('user_id', $userId)
            ->orderByDesc('timestamp')
            ->paginate($request->get('per_page', 50));

        return response()->json($logs);
    }

    /**
     * Filtrar por entidad
     */
    public function byEntity(Request $request, $type, $id)
    {
        $logs = AuditLog::with('user:id,nombre,apellido,role')
            ->where('entity', $type)
            ->where('entity_id', $id)
            ->orderByDesc('timestamp')
            ->paginate($request->get('per_page', 50));

        return response()->json($logs);
    }
}
