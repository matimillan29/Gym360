<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ejercicio extends Model
{
    protected $fillable = [
        'nombre',
        'descripcion',
        'video_url',
        'etapas',
        'categorias_zona',
        'patrones_movimiento',
        'grupos_musculares',
        'es_global',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'etapas' => 'array',
            'categorias_zona' => 'array',
            'patrones_movimiento' => 'array',
            'grupos_musculares' => 'array',
            'es_global' => 'boolean',
        ];
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeGlobales($query)
    {
        return $query->where('es_global', true);
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
