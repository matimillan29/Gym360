@extends('emails.layout')

@section('content')
    <h2>Tu cuota está por vencer</h2>

    <p>Hola {{ $nombre }},</p>

    <p>Te recordamos que tu cuota vence pronto. Acercate al gimnasio para renovarla y seguir entrenando sin interrupciones.</p>

    <div class="info-box">
        <p><strong>Vencimiento:</strong> {{ $fechaVencimiento }}</p>
        <p><strong>Días restantes:</strong> {{ $diasRestantes }} días</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div class="detail-row">
            <span class="detail-label">Plan</span>
            <span class="detail-value">{{ $planNombre }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Monto</span>
            <span class="detail-value">${{ number_format($monto, 0, ',', '.') }}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
            <span class="detail-label">Período</span>
            <span class="detail-value">{{ $fechaInicio }} - {{ $fechaVencimiento }}</span>
        </div>
    </div>

    <p>Para consultas, no dudes en contactarnos.</p>

    <p style="margin-top: 20px;">¡Te esperamos!</p>
@endsection
