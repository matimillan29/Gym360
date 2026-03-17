<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;
    protected $table = 'audit_log';

    protected $fillable = [
        'user_id',
        'user_type',
        'action',
        'entity',
        'entity_id',
        'old_data',
        'new_data',
        'ip',
        'timestamp',
    ];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
        'timestamp' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
