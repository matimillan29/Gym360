<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Anamnesis extends Model
{
    protected $table = 'anamnesis';

    protected $fillable = [
        'entrenado_id',
        'peso',
        'altura',
        'medidas',
        'lesiones_previas',
        'lesiones_actuales',
        'cirugias',
        'molestias',
        'condiciones_medicas',
        'medicacion',
        'alergias',
        'experiencia_gym',
        'años_entrenamiento',
        'deportes',
        'frecuencia_actual',
        'objetivos_principales',
        'objetivos_secundarios',
        'disponibilidad_dias',
        'tiempo_por_sesion',
        'ejercicios_contraindicados',
        'limitaciones_movimiento',
        'equipamiento_casa',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'medidas' => 'array',
            'peso' => 'decimal:2',
            'altura' => 'decimal:2',
        ];
    }

    public function entrenado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entrenado_id');
    }

    public function getImcAttribute(): ?float
    {
        if (!$this->peso || !$this->altura) {
            return null;
        }
        $alturaM = $this->altura / 100;
        return round($this->peso / ($alturaM * $alturaM), 2);
    }
}
