<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sesion extends Model
{
    use SoftDeletes;

    protected $table = 'sesiones';

    protected $fillable = [
        'microciclo_id',
        'numero',
        'nombre',
        'fecha_programada',
        'logica_entrenamiento',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha_programada' => 'date',
        ];
    }

    public function microciclo(): BelongsTo
    {
        return $this->belongsTo(Microciclo::class);
    }

    public function ejercicios(): HasMany
    {
        return $this->hasMany(SesionEjercicio::class)->orderBy('orden');
    }

    public function registros(): HasMany
    {
        return $this->hasMany(RegistroSesion::class);
    }
}
