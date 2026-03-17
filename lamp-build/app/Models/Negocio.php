<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Negocio extends Model
{
    protected $fillable = [
        'nombre',
        'logo',
        'direccion',
        'telefono',
        'email',
        'instagram',
        'descripcion',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    public function cupones(): HasMany
    {
        return $this->hasMany(Cupon::class);
    }

    public function cuponesActivos(): HasMany
    {
        return $this->cupones()
            ->where('activo', true)
            ->where(function ($q) {
                $q->whereNull('fecha_fin')
                    ->orWhere('fecha_fin', '>=', now());
            });
    }
}
