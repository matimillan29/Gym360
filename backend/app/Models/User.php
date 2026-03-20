<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'email',
        'password',
        'nombre',
        'apellido',
        'dni',
        'telefono',
        'fecha_nacimiento',
        'profesion',
        'foto',
        'estado',
        'plan_complejo',
        'entrenador_asignado_id',
        'plan_cuota_id',
        'sucursal_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'fecha_nacimiento' => 'date',
            'plan_complejo' => 'boolean',
        ];
    }

    // Scopes
    public function scopeEntrenadores($query)
    {
        return $query->whereIn('role', ['admin', 'entrenador']);
    }

    public function scopeEntrenados($query)
    {
        return $query->where('role', 'entrenado');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'activo');
    }

    // Relaciones
    public function entrenadorAsignado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entrenador_asignado_id');
    }

    public function planCuota(): BelongsTo
    {
        return $this->belongsTo(PlanCuota::class);
    }

    public function entrenadosAsignados(): HasMany
    {
        return $this->hasMany(User::class, 'entrenador_asignado_id');
    }

    public function anamnesis(): HasOne
    {
        return $this->hasOne(Anamnesis::class, 'entrenado_id');
    }

    public function macrociclos(): HasMany
    {
        return $this->hasMany(Macrociclo::class, 'entrenado_id');
    }

    public function cuotas(): HasMany
    {
        return $this->hasMany(Cuota::class, 'entrenado_id');
    }

    /**
     * Obtener la cuota activa (más reciente no vencida)
     */
    public function cuotaActiva()
    {
        return $this->cuotas()
            ->with('plan')
            ->where('fecha_vencimiento', '>=', now()->startOfDay())
            ->orderByDesc('fecha_vencimiento')
            ->first();
    }

    public function evaluaciones(): HasMany
    {
        return $this->hasMany(Evaluacion::class, 'entrenado_id');
    }

    public function linksAdjuntos(): HasMany
    {
        return $this->hasMany(LinkAdjunto::class, 'entrenado_id');
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(Feedback::class, 'entrenado_id');
    }

    // Relaciones inversas (cuando el usuario es entrenador/creador)
    public function evaluacionesCreadas(): HasMany
    {
        return $this->hasMany(Evaluacion::class, 'entrenador_id');
    }

    public function linksAdjuntosCreados(): HasMany
    {
        return $this->hasMany(LinkAdjunto::class, 'entrenador_id');
    }

    public function feedbacksCreados(): HasMany
    {
        return $this->hasMany(Feedback::class, 'entrenador_id');
    }

    public function clasesInstruidas(): HasMany
    {
        return $this->hasMany(HorarioClase::class, 'instructor_id');
    }

    public function asistenciasClases(): HasMany
    {
        return $this->hasMany(AsistenciaClase::class, 'entrenado_id');
    }

    public function ingresos(): HasMany
    {
        return $this->hasMany(Ingreso::class, 'entrenado_id');
    }

    public function otpCodes(): HasMany
    {
        return $this->hasMany(OtpCode::class);
    }

    public function logros(): BelongsToMany
    {
        return $this->belongsToMany(Logro::class, 'logros_usuario')
            ->withPivot(['desbloqueado_en', 'visto'])
            ->withTimestamps();
    }

    public function racha(): HasOne
    {
        return $this->hasOne(Racha::class);
    }

    /**
     * Sucursal principal del usuario
     */
    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    /**
     * Sucursales a las que puede acceder (relación muchos a muchos)
     */
    public function sucursales(): BelongsToMany
    {
        return $this->belongsToMany(Sucursal::class, 'sucursal_user')
            ->withTimestamps();
    }

    /**
     * Obtener todas las sucursales a las que puede acceder (principal + adicionales)
     */
    public function getSucursalesAccesoAttribute(): array
    {
        $ids = $this->sucursales->pluck('id')->toArray();
        if ($this->sucursal_id && !in_array($this->sucursal_id, $ids)) {
            $ids[] = $this->sucursal_id;
        }
        return $ids;
    }

    // Helpers
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isEntrenador(): bool
    {
        return in_array($this->role, ['admin', 'entrenador']);
    }

    public function isEntrenado(): bool
    {
        return $this->role === 'entrenado';
    }

    public function usaPlanComplejo(): bool
    {
        return (bool) $this->plan_complejo;
    }

    public function getNombreCompletoAttribute(): string
    {
        return "{$this->nombre} {$this->apellido}";
    }
}
