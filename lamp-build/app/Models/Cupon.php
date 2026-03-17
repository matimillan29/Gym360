<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Cupon extends Model
{
    protected $table = 'cupones';

    protected $fillable = [
        'negocio_id',
        'titulo',
        'descripcion',
        'codigo',
        'tipo_descuento',
        'valor_descuento',
        'fecha_inicio',
        'fecha_fin',
        'es_cumpleanos',
        'dias_validez_cumple',
        'activo',
        'usos_maximos',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
            'es_cumpleanos' => 'boolean',
            'activo' => 'boolean',
            'valor_descuento' => 'decimal:2',
        ];
    }

    public function negocio(): BelongsTo
    {
        return $this->belongsTo(Negocio::class);
    }

    public function entrenados(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'cupon_entrenado', 'cupon_id', 'entrenado_id')
            ->withPivot(['fecha_asignacion', 'fecha_vencimiento', 'canjeado', 'fecha_canje', 'motivo'])
            ->withTimestamps();
    }

    public function getDescuentoFormateadoAttribute(): string
    {
        if ($this->tipo_descuento === 'porcentaje') {
            return intval($this->valor_descuento) . '%';
        } elseif ($this->tipo_descuento === 'monto_fijo') {
            return '$' . number_format($this->valor_descuento, 0, ',', '.');
        }
        return 'Especial';
    }

    public function estaVigente(): bool
    {
        if (!$this->activo) return false;

        $hoy = now()->startOfDay();

        if ($this->fecha_inicio && $this->fecha_inicio > $hoy) return false;
        if ($this->fecha_fin && $this->fecha_fin < $hoy) return false;

        return true;
    }
}
