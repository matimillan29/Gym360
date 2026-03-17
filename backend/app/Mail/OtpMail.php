<?php

namespace App\Mail;

use App\Models\GymConfig;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $codigo;
    public string $nombre;

    public function __construct(string $codigo, string $nombre)
    {
        $this->codigo = $codigo;
        $this->nombre = $nombre;
    }

    public function envelope(): Envelope
    {
        $gymConfig = GymConfig::get();
        $gymNombre = $gymConfig?->nombre ?? 'Gym360';

        return new Envelope(
            subject: "Tu código de acceso - {$gymNombre}",
        );
    }

    public function content(): Content
    {
        $gymConfig = GymConfig::get();

        return new Content(
            view: 'emails.otp',
            with: [
                'codigo' => $this->codigo,
                'nombre' => $this->nombre,
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
