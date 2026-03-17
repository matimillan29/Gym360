<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cuotas', function (Blueprint $table) {
            $table->integer('clases_usadas')->default(0)->after('monto');
        });
    }

    public function down(): void
    {
        Schema::table('cuotas', function (Blueprint $table) {
            $table->dropColumn('clases_usadas');
        });
    }
};
