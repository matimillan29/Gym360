<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RegistroEjercicio;
use App\Models\RegistroSesion;
use App\Models\SesionEjercicio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgresionController extends Controller
{
    /**
     * Progresión por ejercicio (peso/reps a lo largo del tiempo) para el entrenado autenticado
     */
    public function ejercicios(Request $request)
    {
        $user = $request->user();

        $query = RegistroEjercicio::whereHas('registroSesion', function ($q) use ($user) {
            $q->where('entrenado_id', $user->id);
        })
            ->with([
                'sesionEjercicio.ejercicio:id,nombre',
                'registroSesion:id,fecha',
            ])
            ->orderBy('id');

        // Filtrar por ejercicio específico si se provee
        if ($request->filled('ejercicio_id')) {
            $query->whereHas('sesionEjercicio', function ($q) use ($request) {
                $q->where('ejercicio_id', $request->ejercicio_id);
            });
        }

        $registros = $query->get();

        // Agrupar por ejercicio
        $progresion = $registros->groupBy(function ($reg) {
            return $reg->sesionEjercicio?->ejercicio_id;
        })->map(function ($grupo) {
            $ejercicio = $grupo->first()->sesionEjercicio?->ejercicio;
            return [
                'ejercicio_id' => $ejercicio?->id,
                'ejercicio_nombre' => $ejercicio?->nombre ?? 'Desconocido',
                'datos' => $grupo->map(function ($reg) {
                    return [
                        'fecha' => $reg->registroSesion?->fecha?->toDateString(),
                        'peso' => $reg->peso,
                        'repeticiones' => $reg->repeticiones,
                        'series_completadas' => $reg->series_completadas,
                        'tonelaje' => $reg->tonelaje,
                        'intensidad_percibida' => $reg->intensidad_percibida,
                    ];
                })->values(),
            ];
        })->values();

        return response()->json([
            'data' => $progresion,
        ]);
    }

    /**
     * Tonelaje (peso x reps x series) por sesión/semana
     */
    public function tonelaje(Request $request)
    {
        $user = $request->user();
        $agrupacion = $request->get('agrupacion', 'sesion'); // sesion, semana, mes

        $registrosSesion = RegistroSesion::where('entrenado_id', $user->id)
            ->with('registrosEjercicio')
            ->orderBy('fecha')
            ->get();

        $datos = $registrosSesion->map(function ($regSesion) {
            $tonelajeTotal = $regSesion->registrosEjercicio->sum(function ($regEj) {
                return $regEj->tonelaje;
            });

            return [
                'fecha' => $regSesion->fecha?->toDateString(),
                'sesion_id' => $regSesion->sesion_id,
                'tonelaje' => round($tonelajeTotal, 2),
                'ejercicios_completados' => $regSesion->registrosEjercicio->where('completado', true)->count(),
            ];
        });

        // Agrupar si se pide por semana o mes
        if ($agrupacion === 'semana') {
            $datos = $datos->groupBy(function ($item) {
                return \Carbon\Carbon::parse($item['fecha'])->startOfWeek()->toDateString();
            })->map(function ($grupo, $semana) {
                return [
                    'periodo' => $semana,
                    'tonelaje' => round($grupo->sum('tonelaje'), 2),
                    'sesiones' => $grupo->count(),
                ];
            })->values();
        } elseif ($agrupacion === 'mes') {
            $datos = $datos->groupBy(function ($item) {
                return \Carbon\Carbon::parse($item['fecha'])->format('Y-m');
            })->map(function ($grupo, $mes) {
                return [
                    'periodo' => $mes,
                    'tonelaje' => round($grupo->sum('tonelaje'), 2),
                    'sesiones' => $grupo->count(),
                ];
            })->values();
        }

        return response()->json([
            'data' => $datos,
        ]);
    }

    /**
     * Distribución de volumen por grupo muscular
     */
    public function distribucion(Request $request)
    {
        $user = $request->user();

        $registros = RegistroEjercicio::whereHas('registroSesion', function ($q) use ($user) {
            $q->where('entrenado_id', $user->id);
        })
            ->with('sesionEjercicio.ejercicio')
            ->get();

        $distribucion = [];

        foreach ($registros as $reg) {
            $ejercicio = $reg->sesionEjercicio?->ejercicio;
            if (!$ejercicio || !$ejercicio->grupos_musculares) {
                continue;
            }

            $gruposMusculares = is_array($ejercicio->grupos_musculares)
                ? $ejercicio->grupos_musculares
                : json_decode($ejercicio->grupos_musculares, true) ?? [];

            $series = $reg->series_completadas ?? 1;

            foreach ($gruposMusculares as $grupo) {
                if (!isset($distribucion[$grupo])) {
                    $distribucion[$grupo] = [
                        'grupo_muscular' => $grupo,
                        'series_totales' => 0,
                        'tonelaje_total' => 0,
                    ];
                }
                $distribucion[$grupo]['series_totales'] += $series;
                $distribucion[$grupo]['tonelaje_total'] += round($reg->tonelaje, 2);
            }
        }

        return response()->json([
            'data' => array_values($distribucion),
        ]);
    }
}
