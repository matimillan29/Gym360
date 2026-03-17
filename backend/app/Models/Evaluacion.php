<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evaluacion extends Model
{
    protected $table = 'evaluaciones';

    protected $fillable = [
        'entrenado_id',
        'entrenador_id',
        'tipo',
        'nombre',
        'descripcion',
        'valor',
        'unidad',
        'fecha',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'valor' => 'decimal:2',
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
}
