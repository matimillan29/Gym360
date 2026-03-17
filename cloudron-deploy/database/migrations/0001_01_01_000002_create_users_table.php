<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('password')->nullable(); // Null para entrenados (usan OTP)
            $table->enum('role', ['admin', 'entrenador', 'entrenado'])->default('entrenado');
            $table->string('nombre');
            $table->string('apellido');
            $table->string('dni')->nullable();
            $table->string('telefono')->nullable();
            $table->date('fecha_nacimiento')->nullable();
            $table->string('profesion')->nullable();
            $table->string('foto')->nullable();
            $table->enum('estado', ['activo', 'baja_temporal', 'inactivo'])->default('activo');
            $table->foreignId('entrenador_asignado_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
