<?php

namespace App\Mail;

use App\Models\GymConfig;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BirthdayMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $entrenado;
    public array $cupones;

    public function __construct(User $entrenado, array $cupones = [])
    {
        $this->entrenado = $entrenado;
        $this->cupones = $cupones;
    }

    public function envelope(): Envelope
    {
        $gymConfig = GymConfig::get();
        $gymNombre = $gymConfig?->nombre ?? 'Gym360';

        return new Envelope(
            subject: "¡Feliz Cumpleaños {$this->entrenado->nombre}! - {$gymNombre}",
        );
    }

    public function content(): Content
    {
        $gymConfig = GymConfig::get();

        return new Content(
            view: 'emails.birthday',
            with: [
                'entrenado' => $this->entrenado,
                'cupones' => $this->cupones,
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
