<?php

namespace App\Console\Commands;

use App\Models\Cuota;
use App\Models\GymConfig;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RenovarCuotas extends Command
{
    protected $signature = 'gym:renovar-cuotas';
    protected $description = 'Actualiza estados de cuotas diariamente: marca vencidas y en mora';

    public function handle(): int
    {
        $hoy = Carbon::today();
        $this->info("Procesando cuotas al {$hoy->format('d/m/Y')}...");

        // 1. Marcar cuotas vencidas (pendientes cuya fecha_vencimiento ya pasó)
        $vencidas = $this->marcarVencidas();

        // 2. Marcar cuotas en mora (vencidas con pagos parciales)
        $enMora = $this->marcarMora();

        $this->info("Cuotas marcadas como vencidas: {$vencidas}");
        $this->info("Cuotas marcadas como mora: {$enMora}");
        $this->info('Proceso completado.');

        return Command::SUCCESS;
    }

    private function marcarVencidas(): int
    {
        // Cuotas pendientes cuya fecha de vencimiento ya pasó
        $cuotas = Cuota::where('estado', 'pendiente')
            ->where('fecha_vencimiento', '<', Carbon::today())
            ->get();

        foreach ($cuotas as $cuota) {
            $totalPagado = $cuota->pagos()->sum('monto');

            if ($totalPagado > 0 && $totalPagado < $cuota->monto) {
                // Tiene pagos parciales → mora
                $cuota->update(['estado' => 'mora']);
            } else {
                // Sin pagos → vencido
                $cuota->update(['estado' => 'vencido']);
            }
        }

        return $cuotas->count();
    }

    private function marcarMora(): int
    {
        // Cuotas que estaban como vencido pero tienen pagos parciales → mora
        $cuotas = Cuota::where('estado', 'vencido')
            ->where('fecha_vencimiento', '<', Carbon::today())
            ->get();

        $count = 0;
        foreach ($cuotas as $cuota) {
            $totalPagado = $cuota->pagos()->sum('monto');
            if ($totalPagado > 0 && $totalPagado < $cuota->monto) {
                $cuota->update(['estado' => 'mora']);
                $count++;
            }
        }

        return $count;
    }
}
