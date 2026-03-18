<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Cuota;
use App\Models\Ejercicio;
use App\Models\Evaluacion;
use App\Models\Macrociclo;
use App\Models\RegistroSesion;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Dashboard para entrenador: estadísticas principales
     */
    public function entrenador(Request $request)
    {
        $user = $request->user();

        // Build base query for entrenados, scoped by role
        $entrenados = User::where('role', 'entrenado');
        if ($user->role !== 'admin') {
            $entrenados = $entrenados->where('entrenador_asignado_id', $user->id);
        }

        $entrenadoIds = (clone $entrenados)->pluck('id');

        $stats = [
            'entrenados_activos' => (clone $entrenados)->where('estado', 'activo')->count(),
            'entrenados_baja_temporal' => (clone $entrenados)->where('estado', 'baja_temporal')->count(),
            'planes_activos' => Macrociclo::whereIn('entrenado_id', $entrenadoIds)->where('activo', true)->count(),
            'total_ejercicios' => Ejercicio::count(),
            'sesiones_hoy' => RegistroSesion::whereDate('fecha', today())->count(),
            'cuotas_pendientes' => Cuota::whereIn('entrenado_id', $entrenadoIds)->where('estado', 'pendiente')->count(),
            'cuotas_vencidas' => Cuota::whereIn('entrenado_id', $entrenadoIds)->whereIn('estado', ['vencido', 'mora'])->count(),
            'asistencia_promedio' => $this->calcularAsistenciaPromedio($entrenadoIds),
            'evaluaciones_mes' => Evaluacion::whereIn('entrenado_id', $entrenadoIds)->whereMonth('created_at', now()->month)->count(),
        ];

        return response()->json([
            'data' => $stats,
        ]);
    }

    /**
     * Calcula el porcentaje promedio de asistencia de los entrenados
     */
    private function calcularAsistenciaPromedio($entrenadoIds): int
    {
        if ($entrenadoIds->isEmpty()) {
            return 0;
        }

        $totalRegistros = RegistroSesion::whereIn('entrenado_id', $entrenadoIds)
            ->where('fecha', '>=', Carbon::now()->subDays(30))
            ->count();

        $completados = RegistroSesion::whereIn('entrenado_id', $entrenadoIds)
            ->where('fecha', '>=', Carbon::now()->subDays(30))
            ->where('estado', 'completado')
            ->count();

        return $totalRegistros > 0 ? (int) round(($completados / $totalRegistros) * 100) : 0;
    }

    /**
     * Actividad reciente de los entrenados del entrenador
     */
    public function actividadReciente(Request $request)
    {
        $user = $request->user();

        $entrenados = User::where('role', 'entrenado');
        if ($user->role !== 'admin') {
            $entrenados = $entrenados->where('entrenador_asignado_id', $user->id);
        }
        $entrenadoIds = $entrenados->pluck('id');

        $actividad = RegistroSesion::with('entrenado', 'sesion')
            ->whereIn('entrenado_id', $entrenadoIds)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($registro) {
                return [
                    'id' => $registro->id,
                    'tipo' => 'sesion',
                    'descripcion' => 'Completó sesión ' . ($registro->sesion->numero ?? ''),
                    'entrenado_nombre' => $registro->entrenado->nombre . ' ' . $registro->entrenado->apellido,
                    'fecha' => $registro->created_at->toISOString(),
                ];
            });

        return response()->json([
            'data' => $actividad,
        ]);
    }

    /**
     * Alertas para el entrenador
     */
    public function alertas(Request $request)
    {
        $user = $request->user();

        $entrenados = User::where('role', 'entrenado')->where('estado', 'activo');
        if ($user->role !== 'admin') {
            $entrenados = $entrenados->where('entrenador_asignado_id', $user->id);
        }
        $entrenadoIds = $entrenados->pluck('id');

        $alertas = [];

        // Entrenados con cuotas vencidas o en mora
        $cuotasVencidas = Cuota::with('entrenado')
            ->whereIn('entrenado_id', $entrenadoIds)
            ->whereIn('estado', ['vencido', 'mora'])
            ->get();
        foreach ($cuotasVencidas as $cuota) {
            if ($cuota->entrenado) {
                $alertas[] = [
                    'id' => $cuota->entrenado_id,
                    'nombre' => $cuota->entrenado->nombre,
                    'apellido' => $cuota->entrenado->apellido,
                    'tipo' => 'cuota_vencida',
                    'detalle' => 'Cuota vencida desde ' . ($cuota->fecha_vencimiento ? $cuota->fecha_vencimiento->format('d/m/Y') : 'N/A'),
                ];
            }
        }

        // Entrenados con baja asistencia (menos de 2 sesiones en las últimas 2 semanas)
        foreach ($entrenadoIds as $entrenadoId) {
            $sesionesRecientes = RegistroSesion::where('entrenado_id', $entrenadoId)
                ->where('fecha', '>=', Carbon::now()->subWeeks(2))
                ->count();

            if ($sesionesRecientes < 2) {
                $entrenado = User::select('id', 'nombre', 'apellido')->find($entrenadoId);
                if ($entrenado) {
                    $alertas[] = [
                        'id' => $entrenado->id,
                        'nombre' => $entrenado->nombre,
                        'apellido' => $entrenado->apellido,
                        'tipo' => 'baja_asistencia',
                        'detalle' => "Solo {$sesionesRecientes} sesiones en las últimas 2 semanas",
                    ];
                }
            }
        }

        // Planes por vencer (macrociclos con fecha_fin_estimada cercana)
        $planesPorVencer = Macrociclo::whereIn('entrenado_id', $entrenadoIds)
            ->where('activo', true)
            ->whereNotNull('fecha_fin_estimada')
            ->where('fecha_fin_estimada', '<=', Carbon::now()->addWeeks(2))
            ->where('fecha_fin_estimada', '>=', Carbon::now())
            ->with('entrenado:id,nombre,apellido')
            ->get();
        foreach ($planesPorVencer as $macro) {
            if ($macro->entrenado) {
                $alertas[] = [
                    'id' => $macro->entrenado->id,
                    'nombre' => $macro->entrenado->nombre,
                    'apellido' => $macro->entrenado->apellido,
                    'tipo' => 'plan_por_vencer',
                    'detalle' => 'Plan "' . $macro->nombre . '" vence el ' . $macro->fecha_fin_estimada->format('d/m/Y'),
                ];
            }
        }

        return response()->json([
            'data' => $alertas,
        ]);
    }
}
