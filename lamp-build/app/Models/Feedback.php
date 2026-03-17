<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Feedback extends Model
{
    protected $table = 'feedback';

    protected $fillable = [
        'entrenado_id',
        'entrenador_id',
        'tipo',
        'contenido',
        'privado',
    ];

    protected function casts(): array
    {
        return [
            'privado' => 'boolean',
        ];
    }

    public function entrenado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entrenado_id');
    }

    public function entrenador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entrenador_id');
    }

    public function scopePublicos($query)
    {
        return $query->where('privado', false);
    }
}
