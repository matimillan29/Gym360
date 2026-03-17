<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrenado_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('entrenador_id')->constrained('users')->onDelete('cascade');
            $table->string('tipo'); // Ej: 'fuerza_maxima', 'resistencia', 'aerobico', 'flexibilidad', 'personalizado'
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->decimal('valor', 10, 2)->nullable();
            $table->string('unidad')->nullable(); // kg, reps, metros, minutos, etc.
            $table->date('fecha');
            $table->timestamps();

            $table->index(['entrenado_id', 'tipo', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluaciones');
    }
};
