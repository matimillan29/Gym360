<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CuponEntrenado extends Model
{
    protected $table = 'cupon_entrenado';

    protected $fillable = [
        'cupon_id',
        'entrenado_id',
        'fecha_asignacion',
        'fecha_vencimiento',
        'canjeado',
        'fecha_canje',
        'motivo',
    ];

    protected function casts(): array
    {
        return [
            'fecha_asignacion' => 'date',
            'fecha_vencimiento' => 'date',
            'canjeado' => 'boolean',
            'fecha_canje' => 'datetime',
        ];
    }

    public function cupon(): BelongsTo
    {
        return $this->belongsTo(Cupon::class);
    }

    public function entrenado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entrenado_id');
    }

    public function estaVigente(): bool
    {
        return !$this->canjeado && $this->fecha_vencimiento >= now()->startOfDay();
    }

    public function estaVencido(): bool
    {
        return $this->fecha_vencimiento < now()->startOfDay();
    }
}
