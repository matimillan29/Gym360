<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cuota extends Model
{
    protected $fillable = [
        'entrenado_id',
        'plan_id',
        'fecha_inicio',
        'fecha_vencimiento',
        'monto',
        'estado',
        'clases_usadas',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date',
            'fecha_vencimiento' => 'date',
            'monto' => 'decimal:2',
            'clases_usadas' => 'integer',
        ];
    }

    public function entrenado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entrenado_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(PlanCuota::class, 'plan_id');
    }

    /**
     * Alias de plan() para compatibilidad
     */
    public function planCuota(): BelongsTo
    {
        return $this->plan();
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class);
    }

    public function getTotalPagadoAttribute(): float
    {
        return $this->pagos()->sum('monto');
    }

    public function getSaldoPendienteAttribute(): float
    {
        return $this->monto - $this->total_pagado;
    }

    public function getEstaVencidaAttribute(): bool
    {
        return $this->fecha_vencimiento->isPast() && $this->estado !== 'pagado';
    }
}
