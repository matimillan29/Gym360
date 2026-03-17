<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HorarioGym;
use App\Models\DiaEspecial;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CalendarioController extends Controller
{
    /**
     * Obtener horarios regulares
     */
    public function horarios()
    {
        $horarios = HorarioGym::orderBy('dia_semana')->get();

        // Si no hay horarios, crear los por defecto
        if ($horarios->isEmpty()) {
            for ($i = 0; $i <= 6; $i++) {
                HorarioGym::create([
                    'dia_semana' => $i,
                    'hora_apertura' => $i === 0 ? null : '08:00', // Domingos cerrado por defecto
                    'hora_cierre' => $i === 0 ? null : '22:00',
                    'cerrado' => $i === 0,
                ]);
            }
            $horarios = HorarioGym::orderBy('dia_semana')->get();
        }

        return response()->json([
            'data' => $horarios,
        ]);
    }

    /**
     * Actualizar horarios regulares
     */
    public function updateHorarios(Request $request)
    {
        $request->validate([
            'horarios' => 'required|array',
            'horarios.*.dia_semana' => 'required|integer|between:0,6',
            'horarios.*.hora_apertura' => 'nullable|date_format:H:i',
            'horarios.*.hora_cierre' => 'nullable|date_format:H:i',
            'horarios.*.cerrado' => 'boolean',
        ]);

        foreach ($request->horarios as $horario) {
            HorarioGym::updateOrCreate(
                ['dia_semana' => $horario['dia_semana']],
                [
                    'hora_apertura' => $horario['hora_apertura'] ?? null,
                    'hora_cierre' => $horario['hora_cierre'] ?? null,
                    'cerrado' => $horario['cerrado'] ?? false,
                ]
            );
        }

        return response()->json([
            'data' => HorarioGym::orderBy('dia_semana')->get(),
            'message' => 'Horarios actualizados correctamente.',
        ]);
    }

    /**
     * Obtener días especiales (mes actual y siguiente)
     */
    public function diasEspeciales(Request $request)
    {
        $desde = $request->get('desde', now()->startOfMonth()->toDateString());
        $hasta = $request->get('hasta', now()->addMonth()->endOfMonth()->toDateString());

        $dias = DiaEspecial::whereBetween('fecha', [$desde, $hasta])
            ->orderBy('fecha')
            ->get();

        return response()->json([
            'data' => $dias,
        ]);
    }

    /**
     * Crear día especial
     */
    public function storeDiaEspecial(Request $request)
    {
        $request->validate([
            'fecha' => 'required|date|unique:dias_especiales,fecha',
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'required|in:feriado,cierre,horario_especial,evento',
            'hora_apertura' => 'nullable|date_format:H:i',
            'hora_cierre' => 'nullable|date_format:H:i',
            'cerrado' => 'boolean',
            'color' => 'nullable|string|max:7',
        ]);

        $dia = DiaEspecial::create($request->only([
            'fecha',
            'titulo',
            'descripcion',
            'tipo',
            'hora_apertura',
            'hora_cierre',
            'cerrado',
            'color',
        ]));

        return response()->json([
            'data' => $dia,
            'message' => 'Día especial creado correctamente.',
        ], 201);
    }

    /**
     * Actualizar día especial
     */
    public function updateDiaEspecial(Request $request, DiaEspecial $diaEspecial)
    {
        $request->validate([
            'titulo' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'sometimes|required|in:feriado,cierre,horario_especial,evento',
            'hora_apertura' => 'nullable|date_format:H:i',
            'hora_cierre' => 'nullable|date_format:H:i',
            'cerrado' => 'boolean',
            'color' => 'nullable|string|max:7',
        ]);

        $diaEspecial->update($request->only([
            'titulo',
            'descripcion',
            'tipo',
            'hora_apertura',
            'hora_cierre',
            'cerrado',
            'color',
        ]));

        return response()->json([
            'data' => $diaEspecial,
            'message' => 'Día especial actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar día especial
     */
    public function destroyDiaEspecial(DiaEspecial $diaEspecial)
    {
        $diaEspecial->delete();

        return response()->json([
            'message' => 'Día especial eliminado correctamente.',
        ]);
    }

    /**
     * Obtener estado de hoy (público)
     */
    public function estadoHoy()
    {
        $hoy = now();
        $diaSemana = $hoy->dayOfWeek;
        $horaActual = $hoy->format('H:i');

        // Verificar si hay un día especial
        $diaEspecial = DiaEspecial::whereDate('fecha', $hoy->toDateString())->first();

        if ($diaEspecial) {
            // Calcular si está abierto ahora basado en horario del día especial
            $abiertoAhora = false;
            if (!$diaEspecial->cerrado && $diaEspecial->hora_apertura && $diaEspecial->hora_cierre) {
                $abiertoAhora = $horaActual >= $diaEspecial->hora_apertura && $horaActual < $diaEspecial->hora_cierre;
            }

            return response()->json([
                'data' => [
                    'fecha' => $hoy->toDateString(),
                    'es_especial' => true,
                    'titulo' => $diaEspecial->titulo,
                    'descripcion' => $diaEspecial->descripcion,
                    'tipo' => $diaEspecial->tipo,
                    'cerrado' => $diaEspecial->cerrado || !$abiertoAhora,
                    'abierto_ahora' => $abiertoAhora,
                    'hora_apertura' => $diaEspecial->hora_apertura,
                    'hora_cierre' => $diaEspecial->hora_cierre,
                    'horario' => $diaEspecial->horario_formateado,
                    'color' => $diaEspecial->color,
                ],
            ]);
        }

        // Usar horario regular
        $horario = HorarioGym::where('dia_semana', $diaSemana)->first();

        // Calcular si está abierto ahora basado en horario regular
        $abiertoAhora = false;
        if ($horario && !$horario->cerrado && $horario->hora_apertura && $horario->hora_cierre) {
            $abiertoAhora = $horaActual >= $horario->hora_apertura && $horaActual < $horario->hora_cierre;
        }

        return response()->json([
            'data' => [
                'fecha' => $hoy->toDateString(),
                'es_especial' => false,
                'dia' => HorarioGym::DIAS[$diaSemana],
                'cerrado' => ($horario?->cerrado ?? true) || !$abiertoAhora,
                'abierto_ahora' => $abiertoAhora,
                'hora_apertura' => $horario?->hora_apertura,
                'hora_cierre' => $horario?->hora_cierre,
                'horario' => $horario?->horario_formateado ?? 'No definido',
            ],
        ]);
    }

    /**
     * Obtener calendario del mes (público)
     */
    public function calendarioMes(Request $request)
    {
        $mes = $request->get('mes', now()->month);
        $anio = $request->get('anio', now()->year);

        $inicio = Carbon::createFromDate($anio, $mes, 1)->startOfMonth();
        $fin = $inicio->copy()->endOfMonth();

        // Obtener horarios regulares
        $horariosRegulares = HorarioGym::all()->keyBy('dia_semana');

        // Obtener días especiales del mes
        $diasEspeciales = DiaEspecial::whereBetween('fecha', [$inicio, $fin])
            ->get()
            ->keyBy(fn($d) => $d->fecha->format('Y-m-d'));

        // Construir calendario
        $calendario = [];
        $current = $inicio->copy();

        while ($current <= $fin) {
            $fechaStr = $current->format('Y-m-d');
            $diaSemana = $current->dayOfWeek;

            if (isset($diasEspeciales[$fechaStr])) {
                $especial = $diasEspeciales[$fechaStr];
                $calendario[] = [
                    'fecha' => $fechaStr,
                    'dia' => $current->day,
                    'dia_semana' => HorarioGym::DIAS[$diaSemana],
                    'es_especial' => true,
                    'titulo' => $especial->titulo,
                    'tipo' => $especial->tipo,
                    'cerrado' => $especial->cerrado,
                    'horario' => $especial->horario_formateado,
                    'color' => $especial->color,
                ];
            } else {
                $horario = $horariosRegulares[$diaSemana] ?? null;
                $calendario[] = [
                    'fecha' => $fechaStr,
                    'dia' => $current->day,
                    'dia_semana' => HorarioGym::DIAS[$diaSemana],
                    'es_especial' => false,
                    'cerrado' => $horario?->cerrado ?? true,
                    'horario' => $horario?->horario_formateado ?? 'No definido',
                ];
            }

            $current->addDay();
        }

        return response()->json([
            'data' => [
                'mes' => $mes,
                'anio' => $anio,
                'nombre_mes' => $inicio->translatedFormat('F'),
                'dias' => $calendario,
            ],
        ]);
    }
}
