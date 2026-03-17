<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Nota: este migration convierte columnas enum a varchar para permitir valores adicionales.
// Si se usa doctrine/dbal, se podria usar $table->string()->change() en su lugar.

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('links_adjuntos') && Schema::hasColumn('links_adjuntos', 'categoria')) {
            DB::statement("ALTER TABLE links_adjuntos MODIFY categoria VARCHAR(50) DEFAULT 'otro'");
        }

        if (Schema::hasTable('feedback') && Schema::hasColumn('feedback', 'tipo')) {
            DB::statement("ALTER TABLE feedback MODIFY tipo VARCHAR(50) DEFAULT 'otro'");
        }
    }

    public function down(): void
    {
        // No revertimos a enum porque podria haber datos que no encajen
    }
};
