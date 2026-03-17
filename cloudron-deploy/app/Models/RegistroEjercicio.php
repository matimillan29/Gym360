<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistroEjercicio extends Model
{
    protected $table = 'registros_ejercicio';

    protected $fillable = [
        'registro_sesion_id',
        'sesion_ejercicio_id',
        'peso',
        'repeticiones',
        'series_completadas',
        'intensidad_percibida',
        'descanso_real',
        'completado',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'peso' => 'decimal:2',
            'completado' => 'boolean',
        ];
    }

    public function registroSesion(): BelongsTo
    {
        return $this->belongsTo(RegistroSesion::class);
    }

    public function sesionEjercicio(): BelongsTo
    {
        return $this->belongsTo(SesionEjercicio::class);
    }

    public function getTonelajeAttribute(): float
    {
        if (!$this->peso || !$this->repeticiones || !$this->series_completadas) {
            return 0;
        }
        return $this->peso * $this->repeticiones * $this->series_completadas;
    }
}
