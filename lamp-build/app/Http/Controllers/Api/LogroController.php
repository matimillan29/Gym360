<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Logro;
use App\Models\Racha;
use App\Models\RegistroSesion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LogroController extends Controller
{
    /**
     * Obtener estadísticas de un entrenado (para entrenadores)
     */
    public function estadisticasEntrenado(User $entrenado)
    {
        if (!$entrenado->isEntrenado()) {
            return response()->json([
                'message' => 'Usuario no es entrenado.',
            ], 404);
        }

        return $this->getEstadisticasUsuario($entrenado);
    }

    /**
     * Obtener estadísticas del entrenado (rachas, logros, etc.)
     */
    public function misEstadisticas(Request $request)
    {
        $user = $request->user();
        return $this->getEstadisticasUsuario($user);
    }

    /**
     * Obtener estadísticas de un usuario
     */
    private function getEstadisticasUsuario(User $user)
    {
        // Obtener o crear racha
        $racha = Racha::firstOrCreate(
            ['user_id' => $user->id],
            [
                'racha_actual' => 0,
                'racha_maxima' => 0,
                'entrenamientos_semana' => 0,
                'entrenamientos_mes' => 0,
                'entrenamientos_total' => 0,
            ]
        );

        // Recalcular contadores si es necesario
        $racha->recalcularContadores();
        $racha->save();

        // Verificar si la racha sigue activa
        if (!$racha->estaActiva()) {
            $racha->racha_actual = 0;
            $racha->save();
        }

        // Obtener logros desbloqueados
        $logrosDesbloqueados = $user->logros()
            ->orderBy('logros_usuario.desbloqueado_en', 'desc')
            ->get();

        // Obtener todos los logros disponibles
        $todosLogros = Logro::activos()
            ->orderBy('categoria')
            ->orderBy('orden')
            ->get()
            ->map(function ($logro) use ($logrosDesbloqueados) {
                $desbloqueado = $logrosDesbloqueados->firstWhere('id', $logro->id);
                return [
                    'id' => $logro->id,
                    'codigo' => $logro->codigo,
                    'nombre' => $logro->nombre,
                    'descripcion' => $logro->descripcion,
                    'icono' => $logro->icono,
                    'color' => $logro->color,
                    'categoria' => $logro->categoria,
                    'desbloqueado' => $desbloqueado !== null,
                    'desbloqueado_en' => $desbloqueado?->pivot?->desbloqueado_en,
                ];
            });

        // Agrupar logros por categoría
        $logrosPorCategoria = $todosLogros->groupBy('categoria');

        return response()->json([
            'data' => [
                'racha' => [
                    'actual' => $racha->racha_actual,
                    'maxima' => $racha->racha_maxima,
                    'activa' => $racha->estaActiva(),
                    'ultimo_entrenamiento' => $racha->ultimo_entrenamiento?->format('Y-m-d'),
                ],
                'entrenamientos' => [
                    'semana' => $racha->entrenamientos_semana,
                    'mes' => $racha->entrenamientos_mes,
                    'total' => $racha->entrenamientos_total,
                ],
                'logros' => [
                    'total' => $todosLogros->count(),
                    'desbloqueados' => $logrosDesbloqueados->count(),
                    'recientes' => $logrosDesbloqueados->take(3)->values(),
                    'por_categoria' => $logrosPorCategoria,
                ],
            ],
        ]);
    }

    /**
     * Verificar y otorgar logros al completar un entrenamiento
     */
    public function verificarLogros(Request $request)
    {
        $user = $request->user();
        $nuevosLogros = [];

        // Obtener o crear racha
        $racha = Racha::firstOrCreate(
            ['user_id' => $user->id],
            [
                'racha_actual' => 0,
                'racha_maxima' => 0,
                'entrenamientos_semana' => 0,
                'entrenamientos_mes' => 0,
                'entrenamientos_total' => 0,
            ]
        );

        // Registrar entrenamiento
        $racha->registrarEntrenamiento();

        // Obtener logros ya desbloqueados
        $logrosDesbloqueados = $user->logros()->pluck('logros.id')->toArray();

        // Verificar logros de racha
        $logrosRacha = Logro::activos()
            ->categoria('streak')
            ->whereNotIn('id', $logrosDesbloqueados)
            ->where('valor_requerido', '<=', $racha->racha_actual)
            ->get();

        foreach ($logrosRacha as $logro) {
            $this->otorgarLogro($user, $logro);
            $nuevosLogros[] = $logro;
        }

        // Verificar logros de entrenamientos totales
        $logrosWorkout = Logro::activos()
            ->categoria('workout')
            ->whereNotIn('id', $logrosDesbloqueados)
            ->where('valor_requerido', '<=', $racha->entrenamientos_total)
            ->get();

        foreach ($logrosWorkout as $logro) {
            $this->otorgarLogro($user, $logro);
            $nuevosLogros[] = $logro;
        }

        // Verificar logros de consistencia semanal
        $logrosConsistency = Logro::activos()
            ->categoria('consistency')
            ->whereNotIn('id', $logrosDesbloqueados)
            ->where('valor_requerido', '<=', $racha->entrenamientos_semana)
            ->get();

        foreach ($logrosConsistency as $logro) {
            $this->otorgarLogro($user, $logro);
            $nuevosLogros[] = $logro;
        }

        // Verificar logros especiales
        $this->verificarLogrosEspeciales($user, $nuevosLogros, $logrosDesbloqueados);

        return response()->json([
            'data' => [
                'nuevos_logros' => collect($nuevosLogros)->map(fn($l) => [
                    'id' => $l->id,
                    'nombre' => $l->nombre,
                    'descripcion' => $l->descripcion,
                    'icono' => $l->icono,
                    'color' => $l->color,
                ]),
                'racha_actual' => $racha->racha_actual,
            ],
        ]);
    }

    /**
     * Marcar logros como vistos
     */
    public function marcarVistos(Request $request)
    {
        $user = $request->user();

        DB::table('logros_usuario')
            ->where('user_id', $user->id)
            ->where('visto', false)
            ->update(['visto' => true]);

        return response()->json([
            'message' => 'Logros marcados como vistos.',
        ]);
    }

    /**
     * Obtener logros no vistos (para notificaciones)
     */
    public function logrosNuevos(Request $request)
    {
        $user = $request->user();

        $nuevos = $user->logros()
            ->wherePivot('visto', false)
            ->get();

        return response()->json([
            'data' => $nuevos,
        ]);
    }

    private function otorgarLogro($user, $logro): void
    {
        $user->logros()->attach($logro->id, [
            'desbloqueado_en' => now(),
            'visto' => false,
        ]);
    }

    private function verificarLogrosEspeciales($user, &$nuevosLogros, $logrosDesbloqueados): void
    {
        $hora = now()->hour;

        // Early bird (antes de las 7 AM)
        if ($hora < 7) {
            $logro = Logro::where('codigo', 'early_bird')
                ->whereNotIn('id', $logrosDesbloqueados)
                ->first();
            if ($logro) {
                $this->otorgarLogro($user, $logro);
                $nuevosLogros[] = $logro;
            }
        }

        // Night owl (después de las 10 PM)
        if ($hora >= 22) {
            $logro = Logro::where('codigo', 'night_owl')
                ->whereNotIn('id', $logrosDesbloqueados)
                ->first();
            if ($logro) {
                $this->otorgarLogro($user, $logro);
                $nuevosLogros[] = $logro;
            }
        }

        // Weekend warrior (entrenar sábado y domingo en la misma semana)
        $inicioSemana = now()->startOfWeek();
        $entrenoSabado = RegistroSesion::where('entrenado_id', $user->id)
            ->where('estado', 'completado')
            ->whereBetween('fecha', [$inicioSemana, now()])
            ->whereRaw('DAYOFWEEK(fecha) = 7') // Sábado
            ->exists();

        $entrenoDomingo = RegistroSesion::where('entrenado_id', $user->id)
            ->where('estado', 'completado')
            ->whereBetween('fecha', [$inicioSemana, now()])
            ->whereRaw('DAYOFWEEK(fecha) = 1') // Domingo
            ->exists();

        if ($entrenoSabado && $entrenoDomingo) {
            $logro = Logro::where('codigo', 'weekend_warrior')
                ->whereNotIn('id', $logrosDesbloqueados)
                ->first();
            if ($logro) {
                $this->otorgarLogro($user, $logro);
                $nuevosLogros[] = $logro;
            }
        }
    }
}
