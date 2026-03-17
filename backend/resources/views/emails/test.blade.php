@extends('emails.layout')

@section('content')
    <h2>Email de prueba</h2>

    <p>Hola,</p>

    <p>Este es un email de prueba para verificar que la configuración de correo está funcionando correctamente.</p>

    <div class="success-box">
        <p><strong>¡La configuración de email funciona correctamente!</strong></p>
    </div>

    <p>Si recibiste este email, significa que:</p>

    <ul style="margin: 20px 0; padding-left: 20px;">
        <li style="margin-bottom: 10px;">El servidor SMTP está configurado correctamente</li>
        <li style="margin-bottom: 10px;">Los emails se envían sin problemas</li>
        <li style="margin-bottom: 10px;">El diseño del template se ve correctamente</li>
    </ul>

    <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
        Este email fue enviado el {{ $fecha }} como prueba de configuración.
    </p>
@endsection
