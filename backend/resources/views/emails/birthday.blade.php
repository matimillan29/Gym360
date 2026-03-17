@extends('emails.layout')

@section('content')
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 60px;">🎂</div>
        <h1 style="color: {{ $colorPrincipal }}; margin: 10px 0;">¡Feliz Cumpleaños!</h1>
    </div>

    <p>Hola <strong>{{ $entrenado->nombre }}</strong>,</p>

    <p>En este día tan especial, todo el equipo de <strong>{{ $gymNombre }}</strong> te desea un muy feliz cumpleaños.</p>

    <div class="info-box" style="background-color: {{ $colorPrincipal }}20; border-left: 4px solid {{ $colorPrincipal }};">
        <p style="margin: 0;">¡Esperamos que tengas un día increíble lleno de alegría y que sigas alcanzando todas tus metas!</p>
    </div>

    @if(count($cupones) > 0)
        <div style="margin-top: 30px;">
            <h3 style="color: {{ $colorPrincipal }};">🎁 ¡Tenés regalos de cumpleaños!</h3>
            <p>Como parte de nuestra celebración, te obsequiamos los siguientes cupones:</p>

            @foreach($cupones as $cupon)
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin: 15px 0; border: 2px dashed #f59e0b;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        @if($cupon['negocio_logo'])
                            <img src="{{ $cupon['negocio_logo'] }}" alt="{{ $cupon['negocio_nombre'] }}" style="width: 50px; height: 50px; object-fit: contain; margin-right: 15px; border-radius: 8px;">
                        @endif
                        <div>
                            <strong style="font-size: 16px; color: #92400e;">{{ $cupon['titulo'] }}</strong>
                            <br>
                            <span style="color: #78350f; font-size: 13px;">{{ $cupon['negocio_nombre'] }}</span>
                        </div>
                    </div>
                    @if($cupon['descripcion'])
                        <p style="margin: 10px 0 0 0; color: #78350f; font-size: 14px;">{{ $cupon['descripcion'] }}</p>
                    @endif
                    @if($cupon['codigo'])
                        <div style="margin-top: 10px; background: #fff; padding: 8px 15px; border-radius: 6px; display: inline-block;">
                            <span style="color: #92400e; font-weight: bold;">Código: {{ $cupon['codigo'] }}</span>
                        </div>
                    @endif
                    <p style="margin: 10px 0 0 0; color: #b45309; font-size: 12px;">
                        Válido hasta: {{ $cupon['fecha_vencimiento'] }}
                    </p>
                </div>
            @endforeach

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                Podés ver todos tus cupones en tu perfil dentro de la aplicación.
            </p>
        </div>
    @endif

    <p style="margin-top: 30px;">
        ¡Nos vemos pronto en el gym!
    </p>

    <p style="margin-top: 10px;">
        <strong>Equipo de {{ $gymNombre }}</strong>
    </p>
@endsection
