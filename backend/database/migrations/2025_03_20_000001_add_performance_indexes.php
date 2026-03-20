<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Indexes en users para queries frecuentes
        Schema::table('users', function (Blueprint $table) {
            if (!$this->hasIndex('users', 'users_role_index')) {
                $table->index('role');
            }
            if (!$this->hasIndex('users', 'users_estado_index')) {
                $table->index('estado');
            }
            if (!$this->hasIndex('users', 'users_role_estado_index')) {
                $table->index(['role', 'estado']);
            }
        });

        // Indexes en cuotas
        Schema::table('cuotas', function (Blueprint $table) {
            if (!$this->hasIndex('cuotas', 'cuotas_estado_index')) {
                $table->index('estado');
            }
            if (!$this->hasIndex('cuotas', 'cuotas_entrenado_id_fecha_vencimiento_index')) {
                $table->index(['entrenado_id', 'fecha_vencimiento']);
            }
        });

        // Indexes en ingresos (si la tabla existe)
        if (Schema::hasTable('ingresos')) {
            Schema::table('ingresos', function (Blueprint $table) {
                if (!$this->hasIndex('ingresos', 'ingresos_fecha_salida_index')) {
                    $table->index('fecha_salida');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['estado']);
            $table->dropIndex(['role', 'estado']);
        });

        Schema::table('cuotas', function (Blueprint $table) {
            $table->dropIndex(['estado']);
            $table->dropIndex(['entrenado_id', 'fecha_vencimiento']);
        });

        if (Schema::hasTable('ingresos')) {
            Schema::table('ingresos', function (Blueprint $table) {
                $table->dropIndex(['fecha_salida']);
            });
        }
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        $indexes = Schema::getIndexes($table);
        foreach ($indexes as $index) {
            if ($index['name'] === $indexName) {
                return true;
            }
        }
        return false;
    }
};
