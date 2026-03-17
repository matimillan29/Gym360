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
            $table->string('nombre_alternativo')->nullable(); // Nombre en inglés
            $table->text('descripcion')->nullable();
            $table->text('instrucciones')->nullable();
            $table->string('video_url')->nullable();
            $table->json('etapas')->nullable(); // ['movilidad', 'calentamiento', 'principal', etc.]
            $table->json('categorias_zona')->nullable(); // ['tren_superior', 'tren_inferior', 'core']
            $table->json('patrones_movimiento')->nullable(); // ['empuje_horizontal', 'tiron_vertical', etc.]
            $table->json('grupos_musculares')->nullable(); // ['pectorales', 'dorsales', etc.]
            $table->json('equipamiento')->nullable(); // ['barra', 'mancuernas', etc.]
            $table->string('tipo')->default('fuerza'); // fuerza, cardio, flexibilidad, potencia
            $table->string('dificultad')->default('intermedio'); // principiante, intermedio, avanzado
            $table->boolean('es_personalizado')->default(false);
            $table->foreignId('creado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('nombre');
            $table->index('tipo');
            $table->index('dificultad');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ejercicios');
    }
};
