<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Plan de Entrenamiento - {{ $entrenado->nombre }} {{ $entrenado->apellido }}</title>
<style>
    @page { size: landscape; margin: 15mm; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #333; margin: 0; }

    /* ====== PORTADA (primer tercio) ====== */
    .portada {
        page-break-after: always;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        min-height: 80%;
    }
    .portada .gym-logo {
        max-height: 80px;
        max-width: 200px;
        margin-bottom: 16px;
    }
    .portada .gym-name {
        font-size: 28px;
        font-weight: bold;
        color: {{ $gym->color_principal ?? '#16a34a' }};
        margin-bottom: 6px;
    }
    .portada .gym-contacto {
        font-size: 11px;
        color: #888;
        margin-bottom: 30px;
    }
    .portada .plan-title {
        font-size: 22px;
        font-weight: bold;
        color: #222;
        margin-bottom: 6px;
    }
    .portada .plan-objetivo {
        font-size: 13px;
        color: #555;
        margin-bottom: 24px;
        max-width: 400px;
    }
    .portada .entrenado-box {
        border: 2px solid {{ $gym->color_principal ?? '#16a34a' }};
        border-radius: 10px;
        padding: 16px 30px;
        display: inline-block;
    }
    .portada .entrenado-name {
        font-size: 20px;
        font-weight: bold;
        color: #222;
    }
    .portada .entrenado-info {
        font-size: 11px;
        color: #666;
        margin-top: 4px;
    }
    .portada .fecha {
        margin-top: 20px;
        font-size: 11px;
        color: #999;
    }

    /* ====== SESIONES ====== */
    .sesion {
        page-break-inside: avoid;
        margin-bottom: 18px;
    }
    .sesion-header {
        background: {{ $gym->color_principal ?? '#16a34a' }}15;
        border-left: 4px solid {{ $gym->color_principal ?? '#16a34a' }};
        padding: 6px 12px;
        margin-bottom: 6px;
    }
    .sesion-title {
        font-weight: bold;
        font-size: 13px;
        color: {{ $gym->color_principal ?? '#16a34a' }};
    }
    .sesion-logica {
        color: #666;
        font-size: 11px;
    }
    h2 {
        font-size: 15px;
        color: {{ $gym->color_principal ?? '#16a34a' }};
        border-bottom: 2px solid {{ $gym->color_principal ?? '#16a34a' }};
        padding-bottom: 4px;
        margin: 14px 0 8px;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    th {
        background: #f3f4f6;
        text-align: left;
        padding: 5px 6px;
        font-size: 10px;
        color: #555;
        border-bottom: 1px solid #ddd;
    }
    td { padding: 4px 6px; border-bottom: 1px solid #eee; font-size: 10px; }
    tr:nth-child(even) { background: #fafafa; }
    .obs { font-style: italic; color: #888; font-size: 9px; }
    .registro-col { width: 45px; border: 1px dashed #ccc; }
    .footer {
        margin-top: 16px;
        text-align: center;
        color: #aaa;
        font-size: 9px;
        border-top: 1px solid #eee;
        padding-top: 6px;
    }
    .week-header {
        background: #f0f0f0;
        padding: 4px 10px;
        font-weight: bold;
        font-size: 11px;
        color: #444;
        margin: 10px 0 6px;
        border-radius: 4px;
    }
</style>
</head>
<body>

{{-- ====== PORTADA ====== --}}
<div class="portada">
    @if($gym && $gym->logo)
        <img src="{{ public_path('storage/' . str_replace('/storage/', '', $gym->logo)) }}" class="gym-logo" alt="Logo">
    @endif
    <div class="gym-name">{{ $gym->nombre ?? 'Gimnasio' }}</div>
    @if($gym && ($gym->direccion || $gym->telefono))
        <div class="gym-contacto">
            {{ $gym->direccion ?? '' }}
            @if($gym->direccion && $gym->telefono) &bull; @endif
            {{ $gym->telefono ?? '' }}
        </div>
    @endif

    <div class="plan-title">{{ $plan->nombre ?? 'Plan de Entrenamiento' }}</div>
    @if($plan->objetivo_general)
        <div class="plan-objetivo">{{ $plan->objetivo_general }}</div>
    @endif

    <div class="entrenado-box">
        <div class="entrenado-name">{{ $entrenado->nombre }} {{ $entrenado->apellido }}</div>
        <div class="entrenado-info">
            @if($entrenado->dni) DNI: {{ $entrenado->dni }} @endif
            @if($entrenado->email) &bull; {{ $entrenado->email }} @endif
        </div>
    </div>

    <div class="fecha">
        Fecha de inicio: {{ $plan->fecha_inicio ? \Carbon\Carbon::parse($plan->fecha_inicio)->format('d/m/Y') : '-' }}
        &bull; Generado el {{ now()->format('d/m/Y') }}
    </div>
</div>

{{-- ====== SESIONES ====== --}}
@foreach($plan->mesociclos->sortBy('numero') as $mesociclo)
    @if($plan->tipo_plan !== 'simple' && $plan->mesociclos->count() > 1)
        <h2>{{ $mesociclo->nombre ?? 'Etapa '.$mesociclo->numero }}
            @if($mesociclo->objetivo) &mdash; {{ $mesociclo->objetivo }} @endif
        </h2>
    @endif

    @foreach($mesociclo->microciclos->sortBy('numero') as $microciclo)
        @if($plan->tipo_plan !== 'simple' && $mesociclo->microciclos->count() > 1)
            <div class="week-header">Semana {{ $microciclo->numero }}</div>
        @endif

        @foreach($microciclo->sesiones->sortBy('numero') as $sesion)
            <div class="sesion">
                <div class="sesion-header">
                    <span class="sesion-title">
                        @if($plan->tipo_plan === 'simple')
                            {{ $sesion->nombre ?? 'Día '.$sesion->numero }}
                        @else
                            Sesión {{ $sesion->numero }}
                        @endif
                    </span>
                    @if($sesion->logica_entrenamiento)
                        <span class="sesion-logica"> &mdash; {{ $sesion->logica_entrenamiento }}</span>
                    @endif
                </div>

                @if($sesion->ejercicios->count())
                <table>
                    <thead>
                        <tr>
                            <th style="width:25px">#</th>
                            <th>Ejercicio</th>
                            <th style="width:45px">Series</th>
                            <th style="width:45px">Reps</th>
                            <th style="width:70px">Intensidad</th>
                            <th style="width:55px">Descanso</th>
                            <th class="registro-col">Peso</th>
                            <th class="registro-col">Reps</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($sesion->ejercicios->sortBy('orden') as $ej)
                        <tr>
                            <td>{{ $ej->orden }}</td>
                            <td>
                                <strong>{{ $ej->ejercicio->nombre ?? 'Ejercicio' }}</strong>
                                @if($ej->observaciones)
                                    <br><span class="obs">{{ $ej->observaciones }}</span>
                                @endif
                            </td>
                            <td>{{ $ej->series }}</td>
                            <td>{{ $ej->repeticiones ?? ($ej->tiempo ? $ej->tiempo.'s' : '-') }}</td>
                            <td>
                                @if($ej->intensidad_tipo && $ej->intensidad_valor)
                                    {{ strtoupper($ej->intensidad_tipo) }} {{ $ej->intensidad_valor }}
                                @else
                                    -
                                @endif
                            </td>
                            <td>{{ $ej->descanso ? $ej->descanso.'s' : '-' }}</td>
                            <td class="registro-col"></td>
                            <td class="registro-col"></td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
                @endif

                @if($sesion->observaciones)
                    <p class="obs">Notas: {{ $sesion->observaciones }}</p>
                @endif
            </div>
        @endforeach
    @endforeach
@endforeach

<div class="footer">
    {{ $gym->nombre ?? 'Gimnasio' }} &bull; {{ $entrenado->nombre }} {{ $entrenado->apellido }} &bull; Generado el {{ now()->format('d/m/Y H:i') }}
</div>
</body>
</html>
