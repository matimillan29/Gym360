<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Macrociclo extends Model
{
    protected $fillable = [
        'entrenado_id',
        'nombre',
        'fecha_inicio',
        'fecha_fin_estimada',
        'objetivo_general',
        'activo',
        'tipo_plan',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date',
            'fecha_fin_estimada' => 'date',
            'activo' => 'boolean',
        ];
    }

    public function entrenado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entrenado_id');
    }

    public function mesociclos(): HasMany
    {
        return $this->hasMany(Mesociclo::class)->orderBy('numero');
    }

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function esSimple(): bool
    {
        return $this->tipo_plan === 'simple';
    }

    public function getMesocicloActualAttribute(): ?Mesociclo
    {
        return $this->mesociclos()->where('desbloqueado', true)->orderByDesc('numero')->first();
    }
}
