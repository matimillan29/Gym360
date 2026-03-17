<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ejercicio extends Model
{
    protected $fillable = [
        'nombre',
        'nombre_alternativo',
        'descripcion',
        'instrucciones',
        'video_url',
        'etapas',
        'categorias_zona',
        'patrones_movimiento',
        'grupos_musculares',
        'equipamiento',
        'tipo',
        'dificultad',
        'es_personalizado',
        'creado_por',
    ];

    protected function casts(): array
    {
        return [
            'etapas' => 'array',
            'categorias_zona' => 'array',
            'patrones_movimiento' => 'array',
            'grupos_musculares' => 'array',
            'equipamiento' => 'array',
            'es_personalizado' => 'boolean',
        ];
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function sesionEjercicios(): HasMany
    {
        return $this->hasMany(SesionEjercicio::class);
    }

    public function scopeGlobales($query)
    {
        return $query->where('es_personalizado', false);
    }

    public function scopeByEtapa($query, string $etapa)
    {
        return $query->whereJsonContains('etapas', $etapa);
    }

    public function scopeByCategoria($query, string $categoria)
    {
        return $query->whereJsonContains('categorias_zona', $categoria);
    }

    public function scopeByGrupoMuscular($query, string $grupo)
    {
        return $query->whereJsonContains('grupos_musculares', $grupo);
    }
}
