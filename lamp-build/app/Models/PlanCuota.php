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
        'tipo_acceso',
        'clases_semanales',
        'precio',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'precio' => 'decimal:2',
            'activo' => 'boolean',
            'clases_semanales' => 'integer',
        ];
    }

    /**
     * Verifica si el plan permite acceso a musculación
     */
    public function permiteMusculacion(): bool
    {
        return in_array($this->tipo_acceso, ['solo_musculacion', 'completo', 'mixto']);
    }

    /**
     * Verifica si el plan permite acceso a clases
     */
    public function permiteClases(): bool
    {
        return in_array($this->tipo_acceso, ['solo_clases', 'completo', 'mixto']);
    }

    /**
     * Verifica si el plan tiene clases ilimitadas
     */
    public function clasesIlimitadas(): bool
    {
        return $this->tipo_acceso === 'completo';
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
