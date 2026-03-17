<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Cuota;
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

        // Obtener IDs de entrenados asignados
        $entrenadoIds = User::where('entrenador_asignado_id', $user->id)
            ->pluck('id');

        $totalEntrenados = $entrenadoIds->count();
        $entrenadosActivos = User::where('entrenador_asignado_id', $user->id)
            ->where('estado', 'activo')
            ->count();

        // Planes activos de sus entrenados
        $planesActivos = Macrociclo::whereIn('entrenado_id', $entrenadoIds)
            ->where('activo', true)
            ->count();

        // Cuotas pendientes/vencidas
        $cuotasPendientes = Cuota::whereIn('entrenado_id', $entrenadoIds)
            ->whereIn('estado', ['pendiente', 'mora'])
            ->count();

        // Actividad reciente (últimos 7 días)
        $actividadReciente = RegistroSesion::whereIn('entrenado_id', $entrenadoIds)
            ->where('fecha', '>=', Carbon::now()->subDays(7))
            ->count();

        return response()->json([
            'data' => [
                'total_entrenados' => $totalEntrenados,
                'entrenados_activos' => $entrenadosActivos,
                'planes_activos' => $planesActivos,
                'cuotas_pendientes' => $cuotasPendientes,
                'actividad_reciente_7d' => $actividadReciente,
            ],
        ]);
    }

    /**
     * Actividad reciente de los entrenados del entrenador
     */
    public function actividadReciente(Request $request)
    {
        $user = $request->user();

        $entrenadoIds = User::where('entrenador_asignado_id', $user->id)
            ->pluck('id');

        $registros = RegistroSesion::whereIn('entrenado_id', $entrenadoIds)
            ->with([
                'entrenado:id,nombre,apellido,foto',
                'sesion:id,numero,microciclo_id',
            ])
            ->orderByDesc('fecha')
            ->limit(20)
            ->get();

        return response()->json([
            'data' => $registros,
        ]);
    }

    /**
     * Alertas para el entrenador
     */
    public function alertas(Request $request)
    {
        $user = $request->user();

        $entrenadoIds = User::where('entrenador_asignado_id', $user->id)
            ->where('estado', 'activo')
            ->pluck('id');

        // Entrenados con cuotas vencidas o en mora
        $cuotasVencidas = Cuota::whereIn('entrenado_id', $entrenadoIds)
            ->whereIn('estado', ['vencido', 'mora'])
            ->with('entrenado:id,nombre,apellido')
            ->get()
            ->map(function ($cuota) {
                return [
                    'tipo' => 'cuota_vencida',
                    'entrenado' => $cuota->entrenado,
                    'detalle' => 'Cuota vencida desde ' . $cuota->fecha_vencimiento->format('d/m/Y'),
                ];
            });

        // Entrenados con baja asistencia (menos de 2 sesiones en las últimas 2 semanas)
        $bajaAsistencia = collect();
        foreach ($entrenadoIds as $entrenadoId) {
            $sesionesRecientes = RegistroSesion::where('entrenado_id', $entrenadoId)
                ->where('fecha', '>=', Carbon::now()->subWeeks(2))
                ->count();

            if ($sesionesRecientes < 2) {
                $entrenado = User::select('id', 'nombre', 'apellido')->find($entrenadoId);
                if ($entrenado) {
                    $bajaAsistencia->push([
                        'tipo' => 'baja_asistencia',
                        'entrenado' => $entrenado,
                        'detalle' => "Solo {$sesionesRecientes} sesiones en las últimas 2 semanas",
                    ]);
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
            ->get()
            ->map(function ($macro) {
                return [
                    'tipo' => 'plan_por_vencer',
                    'entrenado' => $macro->entrenado,
                    'detalle' => 'Plan "' . $macro->nombre . '" vence el ' . $macro->fecha_fin_estimada->format('d/m/Y'),
                ];
            });

        $alertas = $cuotasVencidas
            ->concat($bajaAsistencia)
            ->concat($planesPorVencer);

        return response()->json([
            'data' => $alertas->values(),
        ]);
    }
}
