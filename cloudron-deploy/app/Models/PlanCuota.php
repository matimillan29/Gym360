<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlanCuota extends Model
{
    protected $table = 'planes_cuota';

    protected $fillable = [
        'nombre',
        'descripcion',
        'tipo',
        'cantidad_accesos',
        'duracion_dias',
        'precio',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'activo' => 'boolean',
        ];
    }

    public function cuotas(): HasMany
    {
        return $this->hasMany(Cuota::class, 'plan_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }
}
