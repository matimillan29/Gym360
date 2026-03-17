<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Logro extends Model
{
    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'icono',
        'color',
        'categoria',
        'valor_requerido',
        'activo',
        'orden',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    public const CATEGORIAS = [
        'streak' => 'Rachas',
        'workout' => 'Entrenamientos',
        'weight' => 'Peso levantado',
        'consistency' => 'Consistencia',
        'special' => 'Especiales',
    ];

    public const ICONOS = [
        'trophy' => 'Trofeo',
        'fire' => 'Fuego',
        'star' => 'Estrella',
        'medal' => 'Medalla',
        'muscle' => 'Músculo',
        'lightning' => 'Rayo',
        'heart' => 'Corazón',
        'crown' => 'Corona',
        'rocket' => 'Cohete',
        'target' => 'Objetivo',
    ];

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'logros_usuario')
            ->withPivot(['desbloqueado_en', 'visto'])
            ->withTimestamps();
    }

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function scopeCategoria($query, string $categoria)
    {
        return $query->where('categoria', $categoria);
    }
}
