<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Racha extends Model
{
    protected $fillable = [
        'user_id',
        'racha_actual',
        'racha_maxima',
        'ultimo_entrenamiento',
        'entrenamientos_semana',
        'entrenamientos_mes',
        'entrenamientos_total',
    ];

    protected function casts(): array
    {
        return [
            'ultimo_entrenamiento' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Verifica si la racha está activa (entrenó ayer o hoy)
     */
    public function estaActiva(): bool
    {
        if (!$this->ultimo_entrenamiento) {
            return false;
        }

        $diasSinEntrenar = now()->diffInDays($this->ultimo_entrenamiento);
        return $diasSinEntrenar <= 1;
    }

    /**
     * Registra un entrenamiento y actualiza la racha
     */
    public function registrarEntrenamiento(): void
    {
        $hoy = now()->toDateString();

        // Si ya entrenó hoy, no hacer nada
        if ($this->ultimo_entrenamiento && $this->ultimo_entrenamiento->toDateString() === $hoy) {
            return;
        }

        $diasDesdeUltimo = $this->ultimo_entrenamiento
            ? now()->diffInDays($this->ultimo_entrenamiento)
            : null;

        // Actualizar racha
        if ($diasDesdeUltimo === null || $diasDesdeUltimo > 1) {
            // Reiniciar racha
            $this->racha_actual = 1;
        } else {
            // Continuar racha
            $this->racha_actual++;
        }

        // Actualizar máxima si corresponde
        if ($this->racha_actual > $this->racha_maxima) {
            $this->racha_maxima = $this->racha_actual;
        }

        // Actualizar contadores
        $this->ultimo_entrenamiento = $hoy;
        $this->entrenamientos_total++;

        // Recalcular semana/mes
        $this->recalcularContadores();

        $this->save();
    }

    /**
     * Recalcula contadores semanales y mensuales
     */
    public function recalcularContadores(): void
    {
        $user = $this->user;

        // Entrenamientos de la semana actual
        $inicioSemana = now()->startOfWeek();
        $this->entrenamientos_semana = \App\Models\RegistroSesion::where('entrenado_id', $user->id)
            ->where('estado', 'completado')
            ->where('fecha', '>=', $inicioSemana)
            ->count();

        // Entrenamientos del mes actual
        $inicioMes = now()->startOfMonth();
        $this->entrenamientos_mes = \App\Models\RegistroSesion::where('entrenado_id', $user->id)
            ->where('estado', 'completado')
            ->where('fecha', '>=', $inicioMes)
            ->count();
    }
}
