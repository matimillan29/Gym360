<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('macrociclos', function (Blueprint $table) {
            if (!Schema::hasColumn('macrociclos', 'duracion_semanas')) {
                $table->integer('duracion_semanas')->nullable()->after('fecha_fin_estimada');
            }
        });
    }

    public function down(): void
    {
        Schema::table('macrociclos', function (Blueprint $table) {
            $table->dropColumn('duracion_semanas');
        });
    }
};
