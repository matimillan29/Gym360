<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Microciclo extends Model
{
    protected $fillable = [
        'mesociclo_id',
        'numero',
        'tipo',
    ];

    public function mesociclo(): BelongsTo
    {
        return $this->belongsTo(Mesociclo::class);
    }

    public function sesiones(): HasMany
    {
        return $this->hasMany(Sesion::class)->orderBy('numero');
    }
}
