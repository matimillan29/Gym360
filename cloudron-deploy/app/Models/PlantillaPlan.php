<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlantillaPlan extends Model
{
    protected $table = 'plantillas_plan';

    protected $fillable = [
        'nombre',
        'descripcion',
        'estructura',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'estructura' => 'array',
        ];
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
