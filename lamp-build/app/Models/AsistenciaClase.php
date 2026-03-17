<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AsistenciaClase extends Model
{
    protected $table = 'asistencias_clases';

    protected $fillable = [
        'horario_clase_id',
        'entrenado_id',
        'fecha',
        'estado',
        'hora_checkin',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'hora_checkin' => 'datetime',
        ];
    }

    public function horarioClase(): BelongsTo
    {
        return $this->belongsTo(HorarioClase::class, 'horario_clase_id');
    }

    public function entrenado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entrenado_id');
    }

    /**
     * Marcar como presente (check-in)
     */
    public function marcarPresente(): void
    {
        $this->update([
            'estado' => 'presente',
            'hora_checkin' => now(),
        ]);
    }

    /**
     * Cancelar reserva
     */
    public function cancelar(): void
    {
        $this->update(['estado' => 'cancelado']);
    }
}
