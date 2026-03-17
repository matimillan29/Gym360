<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registros_ejercicio', function (Blueprint $table) {
            $table->integer('percepcion_carga')->nullable()->after('intensidad_percibida'); // 1-10
            $table->integer('sensacion_general')->nullable()->after('percepcion_carga'); // 1-10
        });
    }

    public function down(): void
    {
        Schema::table('registros_ejercicio', function (Blueprint $table) {
            $table->dropColumn(['percepcion_carga', 'sensacion_general']);
        });
    }
};
