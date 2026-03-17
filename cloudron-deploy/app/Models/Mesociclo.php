<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Mesociclo extends Model
{
    protected $fillable = [
        'macrociclo_id',
        'numero',
        'nombre',
        'objetivo',
        'tipo',
        'desbloqueado',
    ];

    protected function casts(): array
    {
        return [
            'desbloqueado' => 'boolean',
        ];
    }

    public function macrociclo(): BelongsTo
    {
        return $this->belongsTo(Macrociclo::class);
    }

    public function microciclos(): HasMany
    {
        return $this->hasMany(Microciclo::class)->orderBy('numero');
    }

    public function scopeDesbloqueados($query)
    {
        return $query->where('desbloqueado', true);
    }
}
