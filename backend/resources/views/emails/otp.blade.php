@extends('emails.layout')

@section('content')
    <h2>Tu código de acceso</h2>

    <p>Hola {{ $nombre }},</p>

    <p>Recibimos una solicitud para acceder a tu cuenta. Usá el siguiente código para iniciar sesión:</p>

    <div class="code-box">
        <span class="code">{{ $codigo }}</span>
    </div>

    <div class="info-box">
        <p><strong>Este código vence en 10 minutos.</strong></p>
    </div>

    <p>Si no solicitaste este código, podés ignorar este email. Tu cuenta está segura.</p>

    <p style="margin-top: 30px; color: #9ca3af; font-size: 14px;">
        Por tu seguridad, nunca compartas este código con nadie.
    </p>
@endsection
