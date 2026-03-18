<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ingreso extends Model
{
    protected $fillable = [
        'entrenado_id',
        'cuota_id',
        'fecha_entrada',
        'fecha_salida',
        'duracion_minutos',
        'tipo',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha_entrada' => 'datetime',
            'fecha_salida' => 'datetime',
            'duracion_minutos' => 'integer',
        ];
    }

    public function entrenado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entrenado_id');
    }

    public function cuota(): BelongsTo
    {
        return $this->belongsTo(Cuota::class);
    }
}
