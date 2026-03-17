<?php

namespace App\Mail;

use App\Models\GymConfig;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct()
    {
    }

    public function envelope(): Envelope
    {
        $gymConfig = GymConfig::get();
        $gymNombre = $gymConfig?->nombre ?? 'Gym360';

        return new Envelope(
            subject: "Email de prueba - {$gymNombre}",
        );
    }

    public function content(): Content
    {
        $gymConfig = GymConfig::get();

        return new Content(
            view: 'emails.test',
            with: [
                'fecha' => now()->format('d/m/Y H:i:s'),
                'gymNombre' => $gymConfig?->nombre ?? 'Gym360',
                'gymLogo' => $gymConfig?->logo_absolute_url, // URL absoluta para emails
                'colorPrincipal' => $gymConfig?->color_principal ?? '#3b82f6',
                'gymDireccion' => $gymConfig?->direccion,
                'gymTelefono' => $gymConfig?->telefono,
                'gymEmail' => $gymConfig?->email,
                'redesSociales' => $gymConfig?->redes_sociales,
            ],
        );
    }
}
