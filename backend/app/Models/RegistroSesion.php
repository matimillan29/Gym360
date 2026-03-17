<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RegistroSesion extends Model
{
    protected $table = 'registros_sesion';

    protected $fillable = [
        'sesion_id',
        'entrenado_id',
        'fecha',
        'estado',
        'feedback_general',
        'hora_inicio',
        'hora_fin',
        'completada',
        'sensacion',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'datetime',
            'hora_inicio' => 'datetime',
            'hora_fin' => 'datetime',
            'completada' => 'boolean',
        ];
    }

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(Sesion::class);
    }

    public function entrenado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entrenado_id');
    }

    public function registrosEjercicio(): HasMany
    {
        return $this->hasMany(RegistroEjercicio::class);
    }
}
