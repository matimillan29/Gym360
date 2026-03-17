<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $gymNombre ?? 'Gym360' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background-color: {{ $colorPrincipal ?? '#3b82f6' }};
            padding: 30px;
            text-align: center;
        }
        .header img {
            max-height: 60px;
            margin-bottom: 10px;
        }
        .header h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #1f2937;
            font-size: 20px;
            margin-bottom: 20px;
        }
        .content p {
            color: #4b5563;
            margin-bottom: 15px;
        }
        .button {
            display: inline-block;
            background-color: {{ $colorPrincipal ?? '#3b82f6' }};
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
        .button:hover {
            opacity: 0.9;
        }
        .code-box {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .code {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 8px;
            color: {{ $colorPrincipal ?? '#3b82f6' }};
        }
        .info-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-box p {
            color: #92400e;
            margin: 0;
        }
        .success-box {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .success-box p {
            color: #065f46;
            margin: 0;
        }
        .danger-box {
            background-color: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .danger-box p {
            color: #991b1b;
            margin: 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-label {
            color: #6b7280;
        }
        .detail-value {
            color: #1f2937;
            font-weight: 600;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            color: #9ca3af;
            font-size: 14px;
            margin: 5px 0;
        }
        .footer a {
            color: {{ $colorPrincipal ?? '#3b82f6' }};
            text-decoration: none;
        }
        .social-links {
            margin-top: 15px;
        }
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: #6b7280;
        }
        @media (max-width: 600px) {
            .container {
                width: 100%;
            }
            .content {
                padding: 30px 20px;
            }
            .header {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            @if(!empty($gymLogo))
                <img src="{{ $gymLogo }}" alt="{{ $gymNombre ?? 'Logo' }}">
            @endif
            <h1>{{ $gymNombre ?? 'Gym360' }}</h1>
        </div>

        <div class="content">
            @yield('content')
        </div>

        <div class="footer">
            <p><strong>{{ $gymNombre ?? 'Gym360' }}</strong></p>
            @if(!empty($gymDireccion))
                <p>{{ $gymDireccion }}</p>
            @endif
            @if(!empty($gymTelefono))
                <p>Tel: {{ $gymTelefono }}</p>
            @endif
            @if(!empty($gymEmail))
                <p><a href="mailto:{{ $gymEmail }}">{{ $gymEmail }}</a></p>
            @endif

            @if(!empty($redesSociales))
                <div class="social-links">
                    @if(!empty($redesSociales['instagram']))
                        <a href="https://instagram.com/{{ $redesSociales['instagram'] }}">Instagram</a>
                    @endif
                    @if(!empty($redesSociales['facebook']))
                        <a href="{{ $redesSociales['facebook'] }}">Facebook</a>
                    @endif
                    @if(!empty($redesSociales['whatsapp']))
                        <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', $redesSociales['whatsapp']) }}">WhatsApp</a>
                    @endif
                </div>
            @endif

            <p style="margin-top: 20px; font-size: 12px;">
                Este email fue enviado automáticamente. Por favor no respondas a este mensaje.
            </p>
        </div>
    </div>
</body>
</html>
