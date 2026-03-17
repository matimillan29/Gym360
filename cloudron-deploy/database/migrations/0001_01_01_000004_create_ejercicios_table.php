<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ejercicios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->string('video_url')->nullable();
            $table->json('etapas'); // ['movilidad', 'calentamiento', 'principal', etc.]
            $table->json('categorias_zona'); // ['tren_superior', 'tren_inferior', 'core']
            $table->json('patrones_movimiento'); // ['empuje_horizontal', 'tiron_vertical', etc.]
            $table->json('grupos_musculares'); // ['pectorales', 'dorsales', etc.]
            $table->boolean('es_global')->default(true); // Si es de la biblioteca global o personalizado
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('nombre');
            $table->index('es_global');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ejercicios');
    }
};
