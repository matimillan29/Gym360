<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Sucursal extends Model
{
    protected $table = 'sucursales';

    protected $fillable = [
        'nombre',
        'direccion',
        'telefono',
        'email',
        'descripcion',
        'color',
        'activa',
        'es_principal',
    ];

    protected function casts(): array
    {
        return [
            'activa' => 'boolean',
            'es_principal' => 'boolean',
        ];
    }

    /**
     * Usuarios que tienen esta sucursal como principal
     */
    public function usuariosPrincipales(): HasMany
    {
        return $this->hasMany(User::class, 'sucursal_id');
    }

    /**
     * Usuarios que pueden acceder a esta sucursal (relación muchos a muchos)
     */
    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'sucursal_user')
            ->withTimestamps();
    }

    /**
     * Clases de esta sucursal
     */
    public function clases(): HasMany
    {
        return $this->hasMany(Clase::class, 'sucursal_id');
    }

    /**
     * Horarios de clases de esta sucursal
     */
    public function horariosClases(): HasMany
    {
        return $this->hasMany(HorarioClase::class, 'sucursal_id');
    }
}
