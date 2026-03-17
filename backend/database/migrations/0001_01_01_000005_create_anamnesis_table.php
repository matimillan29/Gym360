<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anamnesis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrenado_id')->constrained('users')->onDelete('cascade');

            // Datos antropométricos
            $table->decimal('peso', 5, 2)->nullable();
            $table->decimal('altura', 5, 2)->nullable();
            $table->json('medidas')->nullable(); // hombros, torax, cintura, cadera, muslos, gemelos, brazos

            // Historial médico
            $table->text('lesiones_previas')->nullable();
            $table->text('lesiones_actuales')->nullable();
            $table->text('cirugias')->nullable();
            $table->text('molestias')->nullable();
            $table->text('condiciones_medicas')->nullable();
            $table->text('medicacion')->nullable();
            $table->text('alergias')->nullable();

            // Historial deportivo
            $table->enum('experiencia_gym', ['ninguna', 'principiante', 'intermedio', 'avanzado'])->nullable();
            $table->integer('años_entrenamiento')->nullable();
            $table->text('deportes')->nullable();
            $table->string('frecuencia_actual')->nullable();
            $table->text('objetivos_principales')->nullable();
            $table->text('objetivos_secundarios')->nullable();
            $table->integer('disponibilidad_dias')->nullable();
            $table->string('tiempo_por_sesion')->nullable();

            // Condicionantes
            $table->text('ejercicios_contraindicados')->nullable();
            $table->text('limitaciones_movimiento')->nullable();
            $table->text('equipamiento_casa')->nullable();
            $table->text('notas')->nullable();

            $table->timestamps();

            $table->unique('entrenado_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anamnesis');
    }
};
