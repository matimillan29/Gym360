<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Clase extends Model
{
    protected $table = 'clases';

    protected $fillable = [
        'nombre',
        'descripcion',
        'duracion_minutos',
        'capacidad_maxima',
        'color',
        'activa',
        'requiere_reserva',
        'sucursal_id',
    ];

    protected function casts(): array
    {
        return [
            'activa' => 'boolean',
            'requiere_reserva' => 'boolean',
            'duracion_minutos' => 'integer',
            'capacidad_maxima' => 'integer',
        ];
    }

    public function horarios(): HasMany
    {
        return $this->hasMany(HorarioClase::class, 'clase_id');
    }

    public function horariosActivos(): HasMany
    {
        return $this->hasMany(HorarioClase::class, 'clase_id')
            ->where('cancelada', false);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }
}
