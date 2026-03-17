<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SesionEjercicio extends Model
{
    protected $table = 'sesion_ejercicios';

    protected $fillable = [
        'sesion_id',
        'ejercicio_id',
        'orden',
        'etapa',
        'series',
        'repeticiones',
        'tiempo',
        'intensidad_tipo',
        'intensidad_valor',
        'descanso',
        'observaciones',
        'superserie_con',
    ];

    protected function casts(): array
    {
        return [
            'intensidad_valor' => 'decimal:2',
        ];
    }

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(Sesion::class);
    }

    public function ejercicio(): BelongsTo
    {
        return $this->belongsTo(Ejercicio::class);
    }

    public function superserieCon(): BelongsTo
    {
        return $this->belongsTo(SesionEjercicio::class, 'superserie_con');
    }

    public function getDescripcionIntensidadAttribute(): string
    {
        if (!$this->intensidad_tipo || !$this->intensidad_valor) {
            return '';
        }

        return match($this->intensidad_tipo) {
            'rir' => "RIR {$this->intensidad_valor}",
            'rpe' => "RPE {$this->intensidad_valor}",
            'porcentaje' => "{$this->intensidad_valor}%",
            default => '',
        };
    }
}
