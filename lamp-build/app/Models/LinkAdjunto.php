<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LinkAdjunto extends Model
{
    protected $table = 'links_adjuntos';

    protected $fillable = [
        'entrenado_id',
        'entrenador_id',
        'titulo',
        'url',
        'descripcion',
        'categoria',
    ];

    public function entrenado(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entrenado_id');
    }

    public function entrenador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entrenador_id');
    }
}
