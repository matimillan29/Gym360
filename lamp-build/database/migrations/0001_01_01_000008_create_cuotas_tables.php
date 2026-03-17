<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Planes de cuota del gimnasio
        Schema::create('planes_cuota', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->enum('tipo', ['mensual_libre', 'semanal_2x', 'semanal_3x', 'pack_clases', 'personalizado'])->default('mensual_libre');
            $table->integer('cantidad_accesos')->nullable(); // null = ilimitado
            $table->integer('duracion_dias')->default(30);
            $table->decimal('precio', 10, 2);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // Cuotas de cada entrenado
        Schema::create('cuotas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrenado_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('planes_cuota')->onDelete('restrict');
            $table->date('fecha_inicio');
            $table->date('fecha_vencimiento');
            $table->decimal('monto', 10, 2);
            $table->enum('estado', ['pendiente', 'pagado', 'vencido', 'mora'])->default('pendiente');
            $table->timestamps();

            $table->index(['entrenado_id', 'estado']);
            $table->index('fecha_vencimiento');
        });

        // Pagos
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cuota_id')->constrained()->onDelete('cascade');
            $table->dateTime('fecha');
            $table->decimal('monto', 10, 2);
            $table->enum('metodo', ['efectivo', 'transferencia', 'debito', 'credito', 'otro'])->default('efectivo');
            $table->string('comprobante')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
        Schema::dropIfExists('cuotas');
        Schema::dropIfExists('planes_cuota');
    }
};
