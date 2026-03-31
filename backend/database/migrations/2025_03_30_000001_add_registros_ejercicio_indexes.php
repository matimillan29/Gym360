<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('registros_ejercicio')) {
            Schema::table('registros_ejercicio', function (Blueprint $table) {
                $table->index('registro_sesion_id');
                $table->index('sesion_ejercicio_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('registros_ejercicio')) {
            Schema::table('registros_ejercicio', function (Blueprint $table) {
                $table->dropIndex(['registro_sesion_id']);
                $table->dropIndex(['sesion_ejercicio_id']);
            });
        }
    }
};
