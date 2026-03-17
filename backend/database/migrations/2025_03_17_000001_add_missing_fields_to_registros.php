<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registros_sesion', function (Blueprint $table) {
            if (!Schema::hasColumn('registros_sesion', 'hora_inicio')) {
                $table->datetime('hora_inicio')->nullable()->after('fecha');
            }
            if (!Schema::hasColumn('registros_sesion', 'hora_fin')) {
                $table->datetime('hora_fin')->nullable()->after('hora_inicio');
            }
            if (!Schema::hasColumn('registros_sesion', 'completada')) {
                $table->boolean('completada')->default(false)->after('hora_fin');
            }
            if (!Schema::hasColumn('registros_sesion', 'sensacion')) {
                $table->string('sensacion')->nullable()->after('completada');
            }
            if (!Schema::hasColumn('registros_sesion', 'observaciones')) {
                $table->text('observaciones')->nullable()->after('sensacion');
            }
        });

        Schema::table('registros_ejercicio', function (Blueprint $table) {
            if (!Schema::hasColumn('registros_ejercicio', 'series_realizadas')) {
                $table->json('series_realizadas')->nullable()->after('observaciones');
            }
        });
    }

    public function down(): void
    {
        Schema::table('registros_sesion', function (Blueprint $table) {
            $table->dropColumn(['hora_inicio', 'hora_fin', 'completada', 'sensacion', 'observaciones']);
        });

        Schema::table('registros_ejercicio', function (Blueprint $table) {
            $table->dropColumn('series_realizadas');
        });
    }
};
