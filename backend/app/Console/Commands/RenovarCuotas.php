<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Cuota;
use App\Models\GymConfig;
use App\Mail\CuotaVencidaMail;
use App\Mail\CuotaPorVencerMail;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class RenovarCuotas extends Command
{
    protected $signature = 'gym:renovar-cuotas';
    protected $description = 'Auto-renueva cuotas mensuales y marca vencidas después del día 10';

    private const DIA_VENCIMIENTO = 10;

    public function handle(): int
    {
        $hoy = Carbon::today();
        $mesActual = $hoy->copy()->startOfMonth();

        $this->info("Procesando cuotas para {$mesActual->format('F Y')} (día {$hoy->day})...");

        // Apply SMTP config for emails
        $config = GymConfig::get();
        if ($config) {
            $config->applySmtpConfig();
        }

        // 1. Create cuotas for the new month (run on day 1 or any day if missing)
        $this->crearCuotasMensuales($mesActual);

        // 2. Mark as vencida after day 10
        if ($hoy->day > self::DIA_VENCIMIENTO) {
            $this->marcarVencidas($mesActual);
        }

        // 3. Send reminder emails (day 7, 8, 9)
        if ($hoy->day >= 7 && $hoy->day <= 9) {
            $this->enviarRecordatorios($mesActual);
        }

        $this->info('Cuotas procesadas correctamente.');
        return Command::SUCCESS;
    }

    private function crearCuotasMensuales(Carbon $mesActual): void
    {
        // Find active entrenados with assigned plan that don't have a cuota for this month
        $entrenados = User::where('role', 'entrenado')
            ->where('estado', 'activo')
            ->whereNotNull('plan_cuota_id')
            ->with('planCuota')
            ->get();

        $creadas = 0;

        foreach ($entrenados as $entrenado) {
            $existeCuotaMes = Cuota::where('entrenado_id', $entrenado->id)
                ->where('fecha_inicio', '>=', $mesActual)
                ->where('fecha_inicio', '<', $mesActual->copy()->addMonth())
                ->exists();

            if (!$existeCuotaMes && $entrenado->planCuota) {
                Cuota::create([
                    'entrenado_id' => $entrenado->id,
                    'plan_id' => $entrenado->plan_cuota_id,
                    'fecha_inicio' => $mesActual->copy(),
                    'fecha_vencimiento' => $mesActual->copy()->day(self::DIA_VENCIMIENTO),
                    'monto' => $entrenado->planCuota->precio,
                    'estado' => 'pendiente',
                ]);

                $creadas++;
                $this->info("  Cuota creada para {$entrenado->nombre} {$entrenado->apellido} - \${$entrenado->planCuota->precio}");
            }
        }

        $this->info("Cuotas creadas: {$creadas}");
    }

    private function marcarVencidas(Carbon $mesActual): void
    {
        $fechaLimite = $mesActual->copy()->day(self::DIA_VENCIMIENTO);

        $cuotasVencidas = Cuota::where('estado', 'pendiente')
            ->where('fecha_vencimiento', '<=', $fechaLimite)
            ->where('fecha_inicio', '>=', $mesActual)
            ->where('fecha_inicio', '<', $mesActual->copy()->addMonth())
            ->with('entrenado')
            ->get();

        foreach ($cuotasVencidas as $cuota) {
            $cuota->update(['estado' => 'vencido']);

            // Send vencida email
            try {
                $entrenado = $cuota->entrenado;
                if ($entrenado && $entrenado->email) {
                    $nombreCompleto = "{$entrenado->nombre} {$entrenado->apellido}";
                    Mail::to($entrenado->email)->queue(new CuotaVencidaMail($cuota, $nombreCompleto));
                    $this->info("  Email de vencimiento enviado a {$entrenado->email}");
                }
            } catch (\Exception $e) {
                Log::error("Error enviando email de cuota vencida a entrenado {$cuota->entrenado_id}: {$e->getMessage()}");
                $this->warn("  Error enviando email a {$cuota->entrenado_id}: {$e->getMessage()}");
            }

            $this->info("  Cuota {$cuota->id} marcada como vencida");
        }

        $this->info("Cuotas marcadas como vencidas: {$cuotasVencidas->count()}");
    }

    private function enviarRecordatorios(Carbon $mesActual): void
    {
        $cuotasPendientes = Cuota::where('estado', 'pendiente')
            ->where('fecha_inicio', '>=', $mesActual)
            ->where('fecha_inicio', '<', $mesActual->copy()->addMonth())
            ->with('entrenado')
            ->get();

        $enviados = 0;

        foreach ($cuotasPendientes as $cuota) {
            try {
                $entrenado = $cuota->entrenado;
                if ($entrenado && $entrenado->email) {
                    $nombreCompleto = "{$entrenado->nombre} {$entrenado->apellido}";
                    Mail::to($entrenado->email)->queue(new CuotaPorVencerMail($cuota, $nombreCompleto));
                    $enviados++;
                }
            } catch (\Exception $e) {
                Log::error("Error enviando recordatorio de cuota a entrenado {$cuota->entrenado_id}: {$e->getMessage()}");
                $this->warn("  Error enviando recordatorio: {$e->getMessage()}");
            }
        }

        $this->info("Recordatorios enviados: {$enviados}");
    }
}
