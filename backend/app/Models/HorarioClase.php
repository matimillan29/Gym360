<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HorarioClase extends Model
{
    protected $table = 'horarios_clases';

    protected $fillable = [
        'clase_id',
        'instructor_id',
        'sucursal_id',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
        'fecha_especifica',
        'cancelada',
        'motivo_cancelacion',
    ];

    protected function casts(): array
    {
        return [
            'dia_semana' => 'integer',
            'fecha_especifica' => 'date',
            'cancelada' => 'boolean',
        ];
    }

    public function clase(): BelongsTo
    {
        return $this->belongsTo(Clase::class, 'clase_id');
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function asistencias(): HasMany
    {
        return $this->hasMany(AsistenciaClase::class, 'horario_clase_id');
    }

    /**
     * Obtener asistencias para una fecha específica
     */
    public function asistenciasPorFecha(string $fecha): HasMany
    {
        return $this->asistencias()->where('fecha', $fecha);
    }

    /**
     * Contar lugares disponibles para una fecha
     */
    public function lugaresDisponibles(string $fecha): int
    {
        $reservados = $this->asistencias()
            ->where('fecha', $fecha)
            ->whereIn('estado', ['reservado', 'presente'])
            ->count();

        return max(0, $this->clase->capacidad_maxima - $reservados);
    }

    /**
     * Nombre del día de la semana en español
     */
    public function getNombreDiaAttribute(): string
    {
        $dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return $dias[$this->dia_semana] ?? '';
    }
}
