<?php

namespace App\Mail;

use App\Models\GymConfig;
use App\Models\Cuota;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CuotaPorVencerMail extends Mailable
{
    use Queueable, SerializesModels;

    public Cuota $cuota;
    public string $nombre;

    public function __construct(Cuota $cuota, string $nombre)
    {
        $this->cuota = $cuota;
        $this->nombre = $nombre;
    }

    public function envelope(): Envelope
    {
        $gymConfig = GymConfig::get();
        $gymNombre = $gymConfig?->nombre ?? 'Gym360';

        return new Envelope(
            subject: "Tu cuota vence pronto - {$gymNombre}",
        );
    }

    public function content(): Content
    {
        $gymConfig = GymConfig::get();
        $diasRestantes = now()->diffInDays($this->cuota->fecha_vencimiento, false);

        return new Content(
            view: 'emails.cuota-por-vencer',
            with: [
                'nombre' => $this->nombre,
                'planNombre' => $this->cuota->plan->nombre ?? 'Plan',
                'monto' => $this->cuota->monto,
                'fechaInicio' => $this->cuota->fecha_inicio->format('d/m/Y'),
                'fechaVencimiento' => $this->cuota->fecha_vencimiento->format('d/m/Y'),
                'diasRestantes' => max(0, $diasRestantes),
                'gymNombre' => $gymConfig?->nombre ?? 'Gym360',
                'gymLogo' => $gymConfig?->logo_absolute_url,
                'colorPrincipal' => $gymConfig?->color_principal ?? '#3b82f6',
                'gymDireccion' => $gymConfig?->direccion,
                'gymTelefono' => $gymConfig?->telefono,
                'gymEmail' => $gymConfig?->email,
                'redesSociales' => $gymConfig?->redes_sociales,
            ],
        );
    }
}
