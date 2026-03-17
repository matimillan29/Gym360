<?php

namespace App\Console\Commands;

use App\Mail\BirthdayMail;
use App\Models\Cupon;
use App\Models\CuponEntrenado;
use App\Models\GymConfig;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendBirthdayEmails extends Command
{
    protected $signature = 'gym:birthday-emails';
    protected $description = 'Send birthday emails and assign birthday coupons to trainees';

    public function handle()
    {
        $this->info('Checking for birthdays today...');

        // Get today's date components
        $today = now();
        $month = $today->month;
        $day = $today->day;

        // Find active trainees with birthday today
        $cumpleaneros = User::where('role', 'entrenado')
            ->where('estado', 'activo')
            ->whereMonth('fecha_nacimiento', $month)
            ->whereDay('fecha_nacimiento', $day)
            ->get();

        if ($cumpleaneros->isEmpty()) {
            $this->info('No birthdays today.');
            return Command::SUCCESS;
        }

        $this->info("Found {$cumpleaneros->count()} birthday(s) today!");

        // Get active birthday coupons
        $cuponesCumple = Cupon::where('es_cumpleanos', true)
            ->where('activo', true)
            ->with('negocio')
            ->get();

        // Apply SMTP config
        $config = GymConfig::get();
        if ($config) {
            $config->applySmtpConfig();
        }

        foreach ($cumpleaneros as $entrenado) {
            $this->info("Processing: {$entrenado->nombre} {$entrenado->apellido}");

            $cuponesAsignados = [];

            // Assign birthday coupons
            foreach ($cuponesCumple as $cupon) {
                // Calculate expiration date
                $diasValidez = $cupon->dias_validez_cumple ?? 30;
                $fechaVencimiento = now()->addDays($diasValidez);

                // Check if already assigned this year
                $yaAsignado = CuponEntrenado::where('cupon_id', $cupon->id)
                    ->where('entrenado_id', $entrenado->id)
                    ->where('motivo', 'cumpleanos')
                    ->whereYear('fecha_asignacion', $today->year)
                    ->exists();

                if (!$yaAsignado) {
                    CuponEntrenado::create([
                        'cupon_id' => $cupon->id,
                        'entrenado_id' => $entrenado->id,
                        'fecha_asignacion' => now(),
                        'fecha_vencimiento' => $fechaVencimiento,
                        'motivo' => 'cumpleanos',
                    ]);

                    $cuponesAsignados[] = [
                        'titulo' => $cupon->titulo,
                        'descripcion' => $cupon->descripcion,
                        'codigo' => $cupon->codigo,
                        'negocio_nombre' => $cupon->negocio?->nombre ?? 'El Gimnasio',
                        'negocio_logo' => $cupon->negocio?->logo,
                        'fecha_vencimiento' => $fechaVencimiento->format('d/m/Y'),
                    ];

                    $this->info("  - Assigned coupon: {$cupon->titulo}");
                }
            }

            // Send birthday email
            try {
                Mail::to($entrenado->email)->send(new BirthdayMail($entrenado, $cuponesAsignados));
                $this->info("  - Email sent successfully!");
            } catch (\Exception $e) {
                Log::error("Error sending birthday email to {$entrenado->email}: " . $e->getMessage());
                $this->error("  - Failed to send email: " . $e->getMessage());
            }
        }

        $this->info('Birthday emails process completed!');
        return Command::SUCCESS;
    }
}
