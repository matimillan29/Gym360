<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gym_config', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('logo')->nullable();
            $table->string('color_principal')->default('#3b82f6');
            $table->string('color_secundario')->default('#64748b');
            $table->string('direccion')->nullable();
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->json('redes_sociales')->nullable();
            $table->integer('dias_aviso_vencimiento')->default(5);
            $table->boolean('notificar_vencimiento')->default(true);
            $table->boolean('notificar_nuevo_plan')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gym_config');
    }
};
