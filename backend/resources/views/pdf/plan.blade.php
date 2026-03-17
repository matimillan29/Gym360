<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Plan de Entrenamiento</title>
<style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 20px; }
    h1 { font-size: 20px; color: #16a34a; margin-bottom: 4px; }
    h2 { font-size: 16px; color: #444; margin: 16px 0 8px; border-bottom: 2px solid #16a34a; padding-bottom: 4px; }
    h3 { font-size: 13px; color: #555; margin: 10px 0 6px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #16a34a; padding-bottom: 10px; margin-bottom: 16px; }
    .gym-name { font-size: 14px; color: #666; }
    .entrenado-info { color: #666; font-size: 11px; }
    .sesion { margin-bottom: 16px; page-break-inside: avoid; }
    .sesion-header { background: #f0fdf4; padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; }
    .sesion-title { font-weight: bold; font-size: 13px; }
    .sesion-logica { color: #666; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 11px; color: #555; border-bottom: 1px solid #ddd; }
    td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
    tr:nth-child(even) { background: #fafafa; }
    .etapa { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }
    .obs { font-style: italic; color: #888; font-size: 10px; }
    .footer { margin-top: 20px; text-align: center; color: #999; font-size: 10px; border-top: 1px solid #eee; padding-top: 8px; }
    .registro-col { width: 50px; border: 1px dashed #ccc; }
</style>
</head>
<body>
<div class="header">
    <div>
        <h1>{{ $plan->nombre ?? 'Plan de Entrenamiento' }}</h1>
        <div class="entrenado-info">
            {{ $entrenado->nombre }} {{ $entrenado->apellido }} &mdash;
            {{ $plan->fecha_inicio ? \Carbon\Carbon::parse($plan->fecha_inicio)->format('d/m/Y') : '' }}
        </div>
        @if($plan->objetivo_general)
            <div class="entrenado-info" style="margin-top:4px">Objetivo: {{ $plan->objetivo_general }}</div>
        @endif
    </div>
    <div class="gym-name">
        {{ $gym->nombre ?? 'Gym360' }}
    </div>
</div>

@foreach($plan->mesociclos->sortBy('numero') as $mesociclo)
    @if($plan->tipo_plan !== 'simple')
        <h2>{{ $mesociclo->nombre ?? 'Mesociclo '.$mesociclo->numero }}</h2>
    @endif

    @foreach($mesociclo->microciclos->sortBy('numero') as $microciclo)
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
                            <th>#</th>
                            <th>Ejercicio</th>
                            <th>Series</th>
                            <th>Reps</th>
                            <th>Intensidad</th>
                            <th>Descanso</th>
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
                    <p class="obs">{{ $sesion->observaciones }}</p>
                @endif
            </div>
        @endforeach
    @endforeach
@endforeach

<div class="footer">
    {{ $gym->nombre ?? 'Gym360' }} &mdash; Generado el {{ now()->format('d/m/Y') }}
</div>
</body>
</html>
