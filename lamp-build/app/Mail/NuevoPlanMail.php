<?php

namespace App\Mail;

use App\Models\GymConfig;
use App\Models\Macrociclo;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NuevoPlanMail extends Mailable
{
    use Queueable, SerializesModels;

    public Macrociclo $macrociclo;
    public string $nombre;
    public string $entrenadorNombre;

    public function __construct(Macrociclo $macrociclo, string $nombre, string $entrenadorNombre)
    {
        $this->macrociclo = $macrociclo;
        $this->nombre = $nombre;
        $this->entrenadorNombre = $entrenadorNombre;
    }

    public function envelope(): Envelope
    {
        $gymConfig = GymConfig::get();
        $gymNombre = $gymConfig?->nombre ?? 'Gym360';

        return new Envelope(
            subject: "¡Nuevo plan de entrenamiento! - {$gymNombre}",
        );
    }

    public function content(): Content
    {
        $gymConfig = GymConfig::get();

        return new Content(
            view: 'emails.nuevo-plan',
            with: [
                'nombre' => $this->nombre,
                'objetivo' => $this->macrociclo->objetivo_general,
                'fechaInicio' => $this->macrociclo->fecha_inicio->format('d/m/Y'),
                'entrenadorNombre' => $this->entrenadorNombre,
                'totalMesociclos' => $this->macrociclo->mesociclos()->count(),
                'appUrl' => config('app.url'),
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
