<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiaEspecial extends Model
{
    protected $table = 'dias_especiales';

    protected $fillable = [
        'fecha',
        'titulo',
        'descripcion',
        'tipo',
        'hora_apertura',
        'hora_cierre',
        'cerrado',
        'color',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'cerrado' => 'boolean',
        ];
    }

    public const TIPOS = [
        'feriado' => 'Feriado',
        'cierre' => 'Cierre extraordinario',
        'horario_especial' => 'Horario especial',
        'evento' => 'Evento',
    ];

    public function getTipoLabelAttribute(): string
    {
        return self::TIPOS[$this->tipo] ?? $this->tipo;
    }

    public function getHorarioFormateadoAttribute(): string
    {
        if ($this->cerrado) {
            return 'Cerrado';
        }

        if (!$this->hora_apertura || !$this->hora_cierre) {
            return 'Horario normal';
        }

        return substr($this->hora_apertura, 0, 5) . ' - ' . substr($this->hora_cierre, 0, 5);
    }
}
