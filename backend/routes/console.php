<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Actualizar estados de cuotas diariamente a las 6 AM
Schedule::command('gym:renovar-cuotas')->dailyAt('06:00');
