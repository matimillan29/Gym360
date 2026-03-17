<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Schema;

class AuditService
{
    /**
     * Registrar una acción en el log de auditoría
     */
    public static function log(string $action, string $entity, $entityId = null, $oldData = null, $newData = null): void
    {
        // Solo loguear si la tabla existe (puede no existir durante migraciones)
        if (!Schema::hasTable('audit_log')) {
            return;
        }

        try {
            $user = auth()->user();

            AuditLog::create([
                'user_id' => $user?->id,
                'user_type' => $user?->role,
                'action' => $action,
                'entity' => $entity,
                'entity_id' => $entityId,
                'old_data' => $oldData,
                'new_data' => $newData,
                'ip' => request()->ip(),
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            // No dejar que un error en auditoría rompa la operación principal
            \Log::warning("AuditService::log failed: " . $e->getMessage());
        }
    }
}
