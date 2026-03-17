<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('planes_cuota', function (Blueprint $table) {
            // Tipo de acceso que otorga el plan
            $table->enum('tipo_acceso', [
                'solo_musculacion',  // Solo acceso a sala de musculación
                'solo_clases',       // Solo acceso a clases grupales
                'completo',          // Acceso ilimitado a todo
                'mixto'              // Musculación + N clases por semana
            ])->default('completo')->after('duracion_dias');

            // Cantidad de clases semanales (solo aplica para 'solo_clases' y 'mixto')
            $table->integer('clases_semanales')->nullable()->after('tipo_acceso');
        });
    }

    public function down(): void
    {
        Schema::table('planes_cuota', function (Blueprint $table) {
            $table->dropColumn(['tipo_acceso', 'clases_semanales']);
        });
    }
};
