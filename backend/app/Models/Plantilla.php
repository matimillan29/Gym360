<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Plantilla extends Model
{
    protected $table = 'plantillas';

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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
