<?php

namespace App\Mail;

use App\Models\GymConfig;
use App\Models\Mesociclo;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EtapaDesbloqueadaMail extends Mailable
{
    use Queueable, SerializesModels;

    public Mesociclo $mesociclo;
    public string $nombre;

    public function __construct(Mesociclo $mesociclo, string $nombre)
    {
        $this->mesociclo = $mesociclo;
        $this->nombre = $nombre;
    }

    public function envelope(): Envelope
    {
        $gymConfig = GymConfig::get();
        $gymNombre = $gymConfig?->nombre ?? 'Gym360';

        return new Envelope(
            subject: "¡Nueva etapa desbloqueada! - {$gymNombre}",
        );
    }

    public function content(): Content
    {
        $gymConfig = GymConfig::get();

        $tipoLabels = [
            'introductorio' => 'Introductorio',
            'desarrollador' => 'Desarrollador',
            'estabilizador' => 'Estabilizador',
            'recuperacion' => 'Recuperación',
        ];

        return new Content(
            view: 'emails.etapa-desbloqueada',
            with: [
                'nombre' => $this->nombre,
                'mesocicloNombre' => $this->mesociclo->nombre,
                'mesocicloTipo' => $tipoLabels[$this->mesociclo->tipo] ?? $this->mesociclo->tipo,
                'mesocicloObjetivo' => $this->mesociclo->objetivo,
                'totalMicrociclos' => $this->mesociclo->microciclos()->count(),
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
