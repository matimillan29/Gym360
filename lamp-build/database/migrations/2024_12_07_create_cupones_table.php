<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Negocios que ofrecen cupones
        Schema::create('negocios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('logo')->nullable();
            $table->string('direccion')->nullable();
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->string('instagram')->nullable();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // Cupones disponibles
        Schema::create('cupones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('negocio_id')->constrained('negocios')->cascadeOnDelete();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->string('codigo')->nullable(); // Código a mostrar al canjear
            $table->enum('tipo_descuento', ['porcentaje', 'monto_fijo', 'especial'])->default('porcentaje');
            $table->decimal('valor_descuento', 10, 2)->nullable(); // 10 = 10%, o $100
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->boolean('es_cumpleanos')->default(false); // Cupón especial de cumpleaños
            $table->integer('dias_validez_cumple')->nullable()->default(30); // Días después del cumple
            $table->boolean('activo')->default(true);
            $table->integer('usos_maximos')->nullable(); // null = ilimitado
            $table->timestamps();
        });

        // Cupones asignados a entrenados
        Schema::create('cupon_entrenado', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cupon_id')->constrained('cupones')->cascadeOnDelete();
            $table->foreignId('entrenado_id')->constrained('users')->cascadeOnDelete();
            $table->date('fecha_asignacion');
            $table->date('fecha_vencimiento');
            $table->boolean('canjeado')->default(false);
            $table->timestamp('fecha_canje')->nullable();
            $table->string('motivo')->nullable(); // 'cumpleanos', 'promocion', 'manual'
            $table->timestamps();

            $table->unique(['cupon_id', 'entrenado_id', 'fecha_asignacion']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cupon_entrenado');
        Schema::dropIfExists('cupones');
        Schema::dropIfExists('negocios');
    }
};
