<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('macrociclos', function (Blueprint $table) {
            $table->string('tipo_plan', 20)->default('simple')->after('activo');
        });

        // Mark existing plans as complejo
        DB::statement("UPDATE macrociclos SET tipo_plan = 'complejo' WHERE id IN (SELECT DISTINCT macrociclo_id FROM mesociclos)");
    }

    public function down(): void
    {
        Schema::table('macrociclos', function (Blueprint $table) {
            $table->dropColumn('tipo_plan');
        });
    }
};
