<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Links adjuntos
        Schema::create('links_adjuntos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrenado_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('entrenador_id')->constrained('users')->onDelete('cascade');
            $table->string('titulo');
            $table->string('url');
            $table->text('descripcion')->nullable();
            $table->enum('categoria', ['video_tecnica', 'articulo', 'recurso', 'otro'])->default('otro');
            $table->timestamps();

            $table->index('entrenado_id');
        });

        // Feedback
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrenado_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('entrenador_id')->constrained('users')->onDelete('cascade');
            $table->enum('tipo', ['progreso', 'actitud', 'asistencia', 'tecnica', 'otro'])->default('otro');
            $table->text('contenido');
            $table->boolean('privado')->default(false); // Si es true, solo lo ve el entrenador
            $table->timestamps();

            $table->index(['entrenado_id', 'created_at']);
        });

        // Auditoría
        Schema::create('audit_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_type')->nullable(); // admin, entrenador, entrenado
            $table->string('action'); // create, update, delete, login, logout
            $table->string('entity'); // entrenado, plan, cuota, etc.
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('old_data')->nullable();
            $table->json('new_data')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['entity', 'entity_id']);
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_log');
        Schema::dropIfExists('feedback');
        Schema::dropIfExists('links_adjuntos');
    }
};
