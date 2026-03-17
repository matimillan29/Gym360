<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla de sucursales
        Schema::create('sucursales', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('direccion')->nullable();
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->text('descripcion')->nullable();
            $table->string('color', 7)->default('#3B82F6');
            $table->boolean('activa')->default(true);
            $table->boolean('es_principal')->default(false);
            $table->timestamps();
        });

        // Agregar sucursal_id a gym_config para habilitar multi-sucursal
        Schema::table('gym_config', function (Blueprint $table) {
            $table->boolean('multi_sucursal')->default(false)->after('color_secundario');
        });

        // Agregar sucursal_id a users (entrenadores y entrenados pueden pertenecer a una sucursal principal)
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('sucursal_id')->nullable()->after('entrenador_asignado_id')
                ->constrained('sucursales')->nullOnDelete();
        });

        // Tabla pivote para usuarios que pueden acceder a múltiples sucursales
        Schema::create('sucursal_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            
            $table->unique(['sucursal_id', 'user_id']);
        });

        // Agregar sucursal_id a clases
        Schema::table('clases', function (Blueprint $table) {
            $table->foreignId('sucursal_id')->nullable()->after('requiere_reserva')
                ->constrained('sucursales')->nullOnDelete();
        });

        // Agregar sucursal_id a horarios_clases
        Schema::table('horarios_clases', function (Blueprint $table) {
            $table->foreignId('sucursal_id')->nullable()->after('cancelada')
                ->constrained('sucursales')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('horarios_clases', function (Blueprint $table) {
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn('sucursal_id');
        });

        Schema::table('clases', function (Blueprint $table) {
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn('sucursal_id');
        });

        Schema::dropIfExists('sucursal_user');

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn('sucursal_id');
        });

        Schema::table('gym_config', function (Blueprint $table) {
            $table->dropColumn('multi_sucursal');
        });

        Schema::dropIfExists('sucursales');
    }
};
