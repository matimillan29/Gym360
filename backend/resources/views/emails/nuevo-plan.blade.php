@extends('emails.layout')

@section('content')
    <h2>¡Tenés un nuevo plan de entrenamiento!</h2>

    <p>Hola {{ $nombre }},</p>

    <p>Tu entrenador te asignó un nuevo plan de entrenamiento. Ingresá a la app para ver los detalles y comenzar a entrenar.</p>

    <div class="success-box">
        <p><strong>¡Tu plan está listo!</strong></p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div class="detail-row">
            <span class="detail-label">Objetivo</span>
            <span class="detail-value">{{ $objetivo }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Fecha de inicio</span>
            <span class="detail-value">{{ $fechaInicio }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Entrenador</span>
            <span class="detail-value">{{ $entrenadorNombre }}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
            <span class="detail-label">Mesociclos</span>
            <span class="detail-value">{{ $totalMesociclos }} etapas</span>
        </div>
    </div>

    <p style="text-align: center;">
        <a href="{{ $appUrl }}" class="button">Ver mi plan</a>
    </p>

    <p>Recordá que podés descargar tu plan en PDF desde la app para tenerlo siempre a mano.</p>

    <p style="margin-top: 20px;">¡Éxitos en tu entrenamiento!</p>
@endsection
