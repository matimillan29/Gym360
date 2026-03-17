@extends('emails.layout')

@section('content')
    <h2>¡Nueva etapa desbloqueada!</h2>

    <p>Hola {{ $nombre }},</p>

    <p>¡Felicitaciones! Tu entrenador desbloqueó una nueva etapa en tu plan de entrenamiento. Ya podés ver los nuevos ejercicios y sesiones.</p>

    <div class="success-box">
        <p><strong>Etapa disponible:</strong> {{ $mesocicloNombre }}</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div class="detail-row">
            <span class="detail-label">Tipo de etapa</span>
            <span class="detail-value">{{ $mesocicloTipo }}</span>
        </div>
        @if($mesocicloObjetivo)
        <div class="detail-row">
            <span class="detail-label">Objetivo</span>
            <span class="detail-value">{{ $mesocicloObjetivo }}</span>
        </div>
        @endif
        <div class="detail-row" style="border-bottom: none;">
            <span class="detail-label">Semanas</span>
            <span class="detail-value">{{ $totalMicrociclos }} semanas</span>
        </div>
    </div>

    <p style="text-align: center;">
        <a href="{{ $appUrl }}" class="button">Ver mi plan</a>
    </p>

    <p>¡Seguí así, vas muy bien!</p>
@endsection
