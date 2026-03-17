<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'email',
        'password',
        'role',
        'nombre',
        'apellido',
        'dni',
        'telefono',
        'fecha_nacimiento',
        'profesion',
        'foto',
        'estado',
        'entrenador_asignado_id',
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

    public function otpCodes(): HasMany
    {
        return $this->hasMany(OtpCode::class);
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

    public function getNombreCompletoAttribute(): string
    {
        return "{$this->nombre} {$this->apellido}";
    }
}
