<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pago extends Model
{
    protected $fillable = [
        'cuota_id',
        'fecha',
        'monto',
        'metodo',
        'comprobante',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'datetime',
            'monto' => 'decimal:2',
        ];
    }

    public function cuota(): BelongsTo
    {
        return $this->belongsTo(Cuota::class);
    }
}
