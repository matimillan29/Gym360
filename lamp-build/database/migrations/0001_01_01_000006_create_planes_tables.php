<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Macrociclos
        Schema::create('macrociclos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrenado_id')->constrained('users')->onDelete('cascade');
            $table->date('fecha_inicio');
            $table->date('fecha_fin_estimada')->nullable();
            $table->text('objetivo_general')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['entrenado_id', 'activo']);
        });

        // Mesociclos
        Schema::create('mesociclos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('macrociclo_id')->constrained()->onDelete('cascade');
            $table->integer('numero');
            $table->string('nombre');
            $table->text('objetivo')->nullable();
            $table->enum('tipo', ['introductorio', 'desarrollador', 'estabilizador', 'recuperacion'])->default('desarrollador');
            $table->boolean('desbloqueado')->default(false);
            $table->timestamps();

            $table->index(['macrociclo_id', 'numero']);
        });

        // Microciclos
        Schema::create('microciclos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mesociclo_id')->constrained()->onDelete('cascade');
            $table->integer('numero');
            $table->enum('tipo', ['introductorio', 'desarrollo', 'estabilizacion', 'descarga'])->default('desarrollo');
            $table->timestamps();

            $table->index(['mesociclo_id', 'numero']);
        });

        // Sesiones
        Schema::create('sesiones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('microciclo_id')->constrained()->onDelete('cascade');
            $table->integer('numero');
            $table->date('fecha_programada')->nullable();
            $table->string('logica_entrenamiento')->nullable(); // Ej: "Mmss/Mmii/Pm específico"
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->index(['microciclo_id', 'numero']);
        });

        // Ejercicios de la sesión
        Schema::create('sesion_ejercicios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sesion_id')->constrained('sesiones')->onDelete('cascade');
            $table->foreignId('ejercicio_id')->constrained('ejercicios')->onDelete('cascade');
            $table->integer('orden');
            $table->string('etapa'); // movilidad, calentamiento, principal, etc.
            $table->integer('series')->default(3);
            $table->integer('repeticiones')->nullable();
            $table->integer('tiempo')->nullable(); // En segundos, alternativo a reps
            $table->enum('intensidad_tipo', ['rir', 'rpe', 'porcentaje'])->nullable();
            $table->decimal('intensidad_valor', 5, 2)->nullable();
            $table->integer('descanso')->nullable(); // En segundos
            $table->text('observaciones')->nullable();
            $table->foreignId('superserie_con')->nullable()->constrained('sesion_ejercicios')->nullOnDelete();
            $table->timestamps();

            $table->index(['sesion_id', 'orden']);
        });

        // Plantillas de planes
        Schema::create('plantillas_plan', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->json('estructura'); // Estructura completa del plan en JSON
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plantillas_plan');
        Schema::dropIfExists('sesion_ejercicios');
        Schema::dropIfExists('sesiones');
        Schema::dropIfExists('microciclos');
        Schema::dropIfExists('mesociclos');
        Schema::dropIfExists('macrociclos');
    }
};
