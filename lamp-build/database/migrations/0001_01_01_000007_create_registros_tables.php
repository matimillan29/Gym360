<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Registros de sesión (cuando el entrenado completa una sesión)
        Schema::create('registros_sesion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sesion_id')->constrained('sesiones')->onDelete('cascade');
            $table->foreignId('entrenado_id')->constrained('users')->onDelete('cascade');
            $table->dateTime('fecha');
            $table->enum('estado', ['completado', 'parcial', 'falto'])->default('completado');
            $table->text('feedback_general')->nullable();
            $table->timestamps();

            $table->index(['entrenado_id', 'fecha']);
            $table->unique(['sesion_id', 'entrenado_id', 'fecha']);
        });

        // Registros por ejercicio
        Schema::create('registros_ejercicio', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registro_sesion_id')->constrained('registros_sesion')->onDelete('cascade');
            $table->foreignId('sesion_ejercicio_id')->constrained('sesion_ejercicios')->onDelete('cascade');
            $table->decimal('peso', 6, 2)->nullable();
            $table->integer('repeticiones')->nullable();
            $table->integer('series_completadas')->nullable();
            $table->integer('intensidad_percibida')->nullable(); // RPE 1-10
            $table->integer('descanso_real')->nullable(); // En segundos
            $table->boolean('completado')->default(true);
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registros_ejercicio');
        Schema::dropIfExists('registros_sesion');
    }
};
