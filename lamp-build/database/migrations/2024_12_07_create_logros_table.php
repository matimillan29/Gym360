<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla de definiciones de logros
        Schema::create('logros', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique(); // ej: 'streak_7', 'first_workout'
            $table->string('nombre');
            $table->text('descripcion');
            $table->string('icono')->default('trophy'); // nombre del icono
            $table->string('color')->default('#f59e0b'); // color del badge
            $table->string('categoria'); // streak, workout, weight, consistency
            $table->integer('valor_requerido')->nullable(); // ej: 7 para streak_7
            $table->boolean('activo')->default(true);
            $table->integer('orden')->default(0);
            $table->timestamps();
        });

        // Tabla de logros desbloqueados por usuario
        Schema::create('logros_usuario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('logro_id')->constrained('logros')->onDelete('cascade');
            $table->timestamp('desbloqueado_en');
            $table->boolean('visto')->default(false); // para notificación de nuevo logro
            $table->timestamps();

            $table->unique(['user_id', 'logro_id']);
        });

        // Tabla para tracking de rachas
        Schema::create('rachas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('racha_actual')->default(0);
            $table->integer('racha_maxima')->default(0);
            $table->date('ultimo_entrenamiento')->nullable();
            $table->integer('entrenamientos_semana')->default(0);
            $table->integer('entrenamientos_mes')->default(0);
            $table->integer('entrenamientos_total')->default(0);
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rachas');
        Schema::dropIfExists('logros_usuario');
        Schema::dropIfExists('logros');
    }
};
