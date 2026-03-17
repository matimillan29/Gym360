<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla de clases (tipos de clases: Funcional, Yoga, Spinning, etc.)
        Schema::create('clases', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->integer('duracion_minutos')->default(60);
            $table->integer('capacidad_maxima')->default(20);
            $table->string('color', 7)->default('#8B5CF6'); // Color hex para calendario
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });

        // Horarios de clases (cuándo se dicta cada clase)
        Schema::create('horarios_clases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clase_id')->constrained('clases')->onDelete('cascade');
            $table->foreignId('instructor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->tinyInteger('dia_semana')->nullable(); // 0=Domingo, 1=Lunes, etc. NULL si es fecha específica
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->date('fecha_especifica')->nullable(); // Para clases únicas o cancelaciones
            $table->boolean('cancelada')->default(false);
            $table->string('motivo_cancelacion')->nullable();
            $table->timestamps();

            $table->index(['dia_semana', 'hora_inicio']);
            $table->index('fecha_especifica');
        });

        // Asistencias/Reservas a clases
        Schema::create('asistencias_clases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('horario_clase_id')->constrained('horarios_clases')->onDelete('cascade');
            $table->foreignId('entrenado_id')->constrained('users')->onDelete('cascade');
            $table->date('fecha'); // Fecha de la clase
            $table->enum('estado', ['reservado', 'presente', 'ausente', 'cancelado'])->default('reservado');
            $table->timestamp('hora_checkin')->nullable();
            $table->timestamps();

            $table->unique(['horario_clase_id', 'entrenado_id', 'fecha']);
            $table->index(['entrenado_id', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencias_clases');
        Schema::dropIfExists('horarios_clases');
        Schema::dropIfExists('clases');
    }
};
