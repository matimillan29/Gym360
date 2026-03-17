@extends('emails.layout')

@section('content')
    <h2>Tu cuota está vencida</h2>

    <p>Hola {{ $nombre }},</p>

    <p>Te informamos que tu cuota ha vencido. Para continuar accediendo al gimnasio, por favor regularizá tu situación.</p>

    <div class="danger-box">
        <p><strong>Fecha de vencimiento:</strong> {{ $fechaVencimiento }}</p>
        <p><strong>Días vencidos:</strong> {{ $diasVencidos }} días</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div class="detail-row">
            <span class="detail-label">Plan</span>
            <span class="detail-value">{{ $planNombre }}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Monto adeudado</span>
            <span class="detail-value" style="color: #dc2626;">${{ number_format($montoAdeudado, 0, ',', '.') }}</span>
        </div>
        @if($recargo > 0)
        <div class="detail-row" style="border-bottom: none;">
            <span class="detail-label">Recargo por mora</span>
            <span class="detail-value" style="color: #dc2626;">${{ number_format($recargo, 0, ',', '.') }}</span>
        </div>
        @endif
    </div>

    <p>Acercate al gimnasio o contactanos para regularizar tu situación y volver a entrenar.</p>

    <p style="margin-top: 20px;">¡Te esperamos!</p>
@endsection
