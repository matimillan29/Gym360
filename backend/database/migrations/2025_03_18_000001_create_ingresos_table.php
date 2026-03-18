<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingresos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrenado_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('cuota_id')->nullable()->constrained('cuotas')->nullOnDelete();
            $table->dateTime('fecha_entrada');
            $table->dateTime('fecha_salida')->nullable();
            $table->integer('duracion_minutos')->nullable();
            $table->string('tipo')->default('musculacion'); // musculacion, clase
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->index(['entrenado_id', 'fecha_entrada']);
            $table->index('fecha_entrada');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingresos');
    }
};
