<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GymConfig extends Model
{
    protected $table = 'gym_config';

    protected $fillable = [
        'nombre',
        'logo',
        'color_principal',
        'color_secundario',
        'direccion',
        'telefono',
        'email',
        'redes_sociales',
        'dias_aviso_vencimiento',
        'notificar_vencimiento',
        'notificar_nuevo_plan',
    ];

    protected function casts(): array
    {
        return [
            'redes_sociales' => 'array',
            'notificar_vencimiento' => 'boolean',
            'notificar_nuevo_plan' => 'boolean',
        ];
    }

    public static function get(): ?self
    {
        return self::first();
    }

    public static function isConfigured(): bool
    {
        return self::exists();
    }
}
