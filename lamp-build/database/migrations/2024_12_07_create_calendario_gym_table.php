<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Horarios regulares del gimnasio
        Schema::create('horarios_gym', function (Blueprint $table) {
            $table->id();
            $table->tinyInteger('dia_semana'); // 0=Domingo, 1=Lunes, ..., 6=Sábado
            $table->time('hora_apertura')->nullable();
            $table->time('hora_cierre')->nullable();
            $table->boolean('cerrado')->default(false);
            $table->timestamps();

            $table->unique('dia_semana');
        });

        // Días especiales (feriados, cierres extraordinarios, horarios especiales)
        Schema::create('dias_especiales', function (Blueprint $table) {
            $table->id();
            $table->date('fecha');
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->enum('tipo', ['feriado', 'cierre', 'horario_especial', 'evento']);
            $table->time('hora_apertura')->nullable(); // Para horarios especiales
            $table->time('hora_cierre')->nullable();
            $table->boolean('cerrado')->default(false);
            $table->string('color')->nullable()->default('#ef4444'); // Color para mostrar en calendario
            $table->timestamps();

            $table->unique('fecha');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dias_especiales');
        Schema::dropIfExists('horarios_gym');
    }
};
