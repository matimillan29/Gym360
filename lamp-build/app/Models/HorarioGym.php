<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HorarioGym extends Model
{
    protected $table = 'horarios_gym';

    protected $fillable = [
        'dia_semana',
        'hora_apertura',
        'hora_cierre',
        'cerrado',
    ];

    protected function casts(): array
    {
        return [
            'cerrado' => 'boolean',
        ];
    }

    public const DIAS = [
        0 => 'Domingo',
        1 => 'Lunes',
        2 => 'Martes',
        3 => 'Miércoles',
        4 => 'Jueves',
        5 => 'Viernes',
        6 => 'Sábado',
    ];

    public function getNombreDiaAttribute(): string
    {
        return self::DIAS[$this->dia_semana] ?? '';
    }

    public function getHorarioFormateadoAttribute(): string
    {
        if ($this->cerrado) {
            return 'Cerrado';
        }

        if (!$this->hora_apertura || !$this->hora_cierre) {
            return 'No definido';
        }

        return substr($this->hora_apertura, 0, 5) . ' - ' . substr($this->hora_cierre, 0, 5);
    }
}
