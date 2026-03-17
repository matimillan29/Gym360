<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clase;
use App\Models\HorarioClase;
use App\Models\AsistenciaClase;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ClaseController extends Controller
{
    // =====================================================
    // CRUD DE CLASES (tipos de clases)
    // =====================================================

    /**
     * Listar todas las clases
     */
    public function index()
    {
        $clases = Clase::with('sucursal:id,nombre')
            ->withCount('horariosActivos')
            ->orderBy('nombre')
            ->get();

        return response()->json(['data' => $clases]);
    }

    /**
     * Crear una nueva clase
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'duracion_minutos' => 'required|integer|min:15|max:180',
            'capacidad_maxima' => 'required|integer|min:1|max:100',
            'color' => 'nullable|string|max:7',
            'requiere_reserva' => 'sometimes|boolean',
            'sucursal_id' => 'nullable|exists:sucursales,id',
        ]);

        $clase = Clase::create($request->only([
            'nombre', 'descripcion', 'duracion_minutos', 'capacidad_maxima', 'color',
            'requiere_reserva', 'sucursal_id'
        ]));

        return response()->json([
            'data' => $clase->load('sucursal:id,nombre'),
            'message' => 'Actividad creada correctamente.',
        ], 201);
    }

    /**
     * Ver una clase
     */
    public function show(Clase $clase)
    {
        $clase->load('horariosActivos.instructor:id,nombre,apellido');
        return response()->json(['data' => $clase]);
    }

    /**
     * Actualizar una clase
     */
    public function update(Request $request, Clase $clase)
    {
        $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'duracion_minutos' => 'sometimes|required|integer|min:15|max:180',
            'capacidad_maxima' => 'sometimes|required|integer|min:1|max:100',
            'color' => 'nullable|string|max:7',
            'activa' => 'sometimes|boolean',
            'requiere_reserva' => 'sometimes|boolean',
            'sucursal_id' => 'nullable|exists:sucursales,id',
        ]);

        $clase->update($request->only([
            'nombre', 'descripcion', 'duracion_minutos', 'capacidad_maxima', 'color', 'activa',
            'requiere_reserva', 'sucursal_id'
        ]));

        return response()->json([
            'data' => $clase->load('sucursal:id,nombre'),
            'message' => 'Actividad actualizada correctamente.',
        ]);
    }

    /**
     * Eliminar una clase
     */
    public function destroy(Clase $clase)
    {
        $clase->delete();
        return response()->json(['message' => 'Clase eliminada correctamente.']);
    }

    // =====================================================
    // HORARIOS DE CLASES
    // =====================================================

    /**
     * Listar horarios de una clase
     */
    public function horarios(Clase $clase)
    {
        $horarios = $clase->horarios()
            ->with('instructor:id,nombre,apellido')
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();

        return response()->json(['data' => $horarios]);
    }

    /**
     * Crear horario para una clase
     */
    public function storeHorario(Request $request, Clase $clase)
    {
        $request->validate([
            'instructor_id' => 'nullable|exists:users,id',
            'dia_semana' => 'required_without:fecha_especifica|integer|min:0|max:6',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
            'fecha_especifica' => 'nullable|date',
        ]);

        $horario = $clase->horarios()->create($request->only([
            'instructor_id', 'dia_semana', 'hora_inicio', 'hora_fin', 'fecha_especifica'
        ]));

        $horario->load('instructor:id,nombre,apellido');

        return response()->json([
            'data' => $horario,
            'message' => 'Horario creado correctamente.',
        ], 201);
    }

    /**
     * Actualizar horario
     */
    public function updateHorario(Request $request, HorarioClase $horario)
    {
        $request->validate([
            'instructor_id' => 'nullable|exists:users,id',
            'dia_semana' => 'sometimes|integer|min:0|max:6',
            'hora_inicio' => 'sometimes|date_format:H:i',
            'hora_fin' => 'sometimes|date_format:H:i',
            'cancelada' => 'sometimes|boolean',
            'motivo_cancelacion' => 'nullable|string|max:255',
        ]);

        $horario->update($request->only([
            'instructor_id', 'dia_semana', 'hora_inicio', 'hora_fin',
            'cancelada', 'motivo_cancelacion'
        ]));

        return response()->json([
            'data' => $horario->load('instructor:id,nombre,apellido'),
            'message' => 'Horario actualizado correctamente.',
        ]);
    }

    /**
     * Eliminar horario
     */
    public function destroyHorario(HorarioClase $horario)
    {
        $horario->delete();
        return response()->json(['message' => 'Horario eliminado correctamente.']);
    }

    // =====================================================
    // CALENDARIO DE CLASES (vista semanal/mensual)
    // =====================================================

    /**
     * Obtener clases de la semana (para calendario)
     */
    public function calendarioSemana(Request $request)
    {
        $fecha = $request->get('fecha', now()->format('Y-m-d'));
        $inicioSemana = Carbon::parse($fecha)->startOfWeek();
        $finSemana = Carbon::parse($fecha)->endOfWeek();

        $horarios = HorarioClase::with(['clase', 'instructor:id,nombre,apellido'])
            ->where('cancelada', false)
            ->where(function ($query) use ($inicioSemana, $finSemana) {
                // Horarios recurrentes (dia_semana)
                $query->whereNotNull('dia_semana')
                    ->whereNull('fecha_especifica');
            })
            ->orWhere(function ($query) use ($inicioSemana, $finSemana) {
                // Clases especiales en el rango
                $query->whereNotNull('fecha_especifica')
                    ->whereBetween('fecha_especifica', [$inicioSemana, $finSemana]);
            })
            ->get();

        // Construir array de clases por día
        $calendario = [];
        for ($i = 0; $i < 7; $i++) {
            $dia = $inicioSemana->copy()->addDays($i);
            $diaSemana = $dia->dayOfWeek;
            $fechaStr = $dia->format('Y-m-d');

            $clasesDelDia = $horarios->filter(function ($horario) use ($diaSemana, $fechaStr) {
                if ($horario->fecha_especifica) {
                    return $horario->fecha_especifica->format('Y-m-d') === $fechaStr;
                }
                return $horario->dia_semana === $diaSemana;
            })->map(function ($horario) use ($fechaStr) {
                return [
                    'id' => $horario->id,
                    'clase_id' => $horario->clase_id,
                    'clase_nombre' => $horario->clase->nombre,
                    'color' => $horario->clase->color,
                    'hora_inicio' => $horario->hora_inicio,
                    'hora_fin' => $horario->hora_fin,
                    'instructor' => $horario->instructor
                        ? $horario->instructor->nombre . ' ' . $horario->instructor->apellido
                        : null,
                    'capacidad_maxima' => $horario->clase->capacidad_maxima,
                    'lugares_disponibles' => $horario->lugaresDisponibles($fechaStr),
                    'fecha' => $fechaStr,
                ];
            })->values();

            $calendario[] = [
                'fecha' => $fechaStr,
                'dia_nombre' => $dia->locale('es')->dayName,
                'clases' => $clasesDelDia,
            ];
        }

        return response()->json(['data' => $calendario]);
    }

    // =====================================================
    // RESERVAS Y ASISTENCIAS
    // =====================================================

    /**
     * Reservar lugar en una clase (entrenador para entrenado o entrenado para sí mismo)
     */
    public function reservar(Request $request, HorarioClase $horario)
    {
        $request->validate([
            'fecha' => 'required|date|after_or_equal:today',
            'entrenado_id' => 'sometimes|exists:users,id',
        ]);

        $fecha = $request->fecha;
        $user = auth()->user();

        // Si es entrenador reservando para un entrenado
        if ($request->has('entrenado_id') && $user->role !== 'entrenado') {
            $entrenadoId = $request->entrenado_id;
        } else {
            // Entrenado reservando para sí mismo
            $entrenadoId = $user->id;
        }

        // Verificar que el entrenado tiene plan que permite clases
        $entrenado = User::findOrFail($entrenadoId);
        $cuotaActiva = $entrenado->cuotaActiva();

        if (!$cuotaActiva || !$cuotaActiva->plan) {
            return response()->json([
                'message' => 'El entrenado no tiene una cuota activa.',
            ], 422);
        }

        if (!$cuotaActiva->plan->permiteClases()) {
            return response()->json([
                'message' => 'El plan del entrenado no permite acceso a clases grupales.',
            ], 422);
        }

        // Verificar límite de clases semanales (si no es ilimitado)
        if (!$cuotaActiva->plan->clasesIlimitadas()) {
            $inicioSemana = Carbon::parse($fecha)->startOfWeek();
            $finSemana = Carbon::parse($fecha)->endOfWeek();

            $clasesEstaSemana = AsistenciaClase::where('entrenado_id', $entrenadoId)
                ->whereBetween('fecha', [$inicioSemana, $finSemana])
                ->whereIn('estado', ['reservado', 'presente'])
                ->count();

            if ($clasesEstaSemana >= $cuotaActiva->plan->clases_semanales) {
                return response()->json([
                    'message' => "Ya alcanzaste el límite de {$cuotaActiva->plan->clases_semanales} clases semanales.",
                ], 422);
            }
        }

        // Verificar disponibilidad
        if ($horario->lugaresDisponibles($fecha) <= 0) {
            return response()->json([
                'message' => 'No hay lugares disponibles para esta clase.',
            ], 422);
        }

        // Verificar si ya tiene reserva
        $existente = AsistenciaClase::where('horario_clase_id', $horario->id)
            ->where('entrenado_id', $entrenadoId)
            ->where('fecha', $fecha)
            ->first();

        if ($existente) {
            if ($existente->estado === 'cancelado') {
                $existente->update(['estado' => 'reservado']);
                return response()->json([
                    'data' => $existente->load('horarioClase.clase'),
                    'message' => 'Reserva reactivada correctamente.',
                ]);
            }
            return response()->json([
                'message' => 'Ya tenés una reserva para esta clase.',
            ], 422);
        }

        $asistencia = AsistenciaClase::create([
            'horario_clase_id' => $horario->id,
            'entrenado_id' => $entrenadoId,
            'fecha' => $fecha,
            'estado' => 'reservado',
        ]);

        return response()->json([
            'data' => $asistencia->load('horarioClase.clase'),
            'message' => 'Reserva realizada correctamente.',
        ], 201);
    }

    /**
     * Cancelar reserva
     */
    public function cancelarReserva(AsistenciaClase $asistencia)
    {
        $user = auth()->user();

        // Verificar permisos
        if ($user->role === 'entrenado' && $asistencia->entrenado_id !== $user->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($asistencia->estado !== 'reservado') {
            return response()->json([
                'message' => 'Solo se pueden cancelar reservas pendientes.',
            ], 422);
        }

        $asistencia->cancelar();

        return response()->json(['message' => 'Reserva cancelada correctamente.']);
    }

    /**
     * Marcar presente (check-in a clase)
     */
    public function checkinClase(AsistenciaClase $asistencia)
    {
        if ($asistencia->estado !== 'reservado') {
            return response()->json([
                'message' => 'Solo se puede hacer check-in a reservas pendientes.',
            ], 422);
        }

        $asistencia->marcarPresente();

        return response()->json([
            'data' => $asistencia,
            'message' => 'Check-in realizado correctamente.',
        ]);
    }

    /**
     * Ver asistentes de una clase en una fecha
     */
    public function asistentes(Request $request, HorarioClase $horario)
    {
        $fecha = $request->get('fecha', now()->format('Y-m-d'));

        $asistencias = AsistenciaClase::with('entrenado:id,nombre,apellido,email,foto')
            ->where('horario_clase_id', $horario->id)
            ->where('fecha', $fecha)
            ->whereIn('estado', ['reservado', 'presente'])
            ->get();

        return response()->json([
            'data' => $asistencias,
            'total' => $asistencias->count(),
            'capacidad' => $horario->clase->capacidad_maxima,
        ]);
    }

    // =====================================================
    // RUTAS PARA ENTRENADOS (mi/)
    // =====================================================

    /**
     * Mis reservas de clases
     */
    public function misReservas(Request $request)
    {
        $user = auth()->user();
        $desde = $request->get('desde', now()->format('Y-m-d'));

        $reservas = AsistenciaClase::with(['horarioClase.clase', 'horarioClase.instructor:id,nombre,apellido'])
            ->where('entrenado_id', $user->id)
            ->where('fecha', '>=', $desde)
            ->whereIn('estado', ['reservado', 'presente'])
            ->orderBy('fecha')
            ->get();

        return response()->json(['data' => $reservas]);
    }

    /**
     * Historial de clases del entrenado
     */
    public function miHistorialClases(Request $request)
    {
        $user = auth()->user();

        $historial = AsistenciaClase::with(['horarioClase.clase'])
            ->where('entrenado_id', $user->id)
            ->orderByDesc('fecha')
            ->paginate(20);

        return response()->json($historial);
    }

    /**
     * Clases disponibles para reservar
     */
    public function clasesDisponibles(Request $request)
    {
        $user = auth()->user();
        $fecha = $request->get('fecha', now()->format('Y-m-d'));
        $diaSemana = Carbon::parse($fecha)->dayOfWeek;

        // Obtener horarios del día
        $horarios = HorarioClase::with(['clase', 'instructor:id,nombre,apellido'])
            ->whereHas('clase', fn($q) => $q->where('activa', true))
            ->where('cancelada', false)
            ->where(function ($query) use ($diaSemana, $fecha) {
                $query->where('dia_semana', $diaSemana)
                    ->whereNull('fecha_especifica');
            })
            ->orWhere('fecha_especifica', $fecha)
            ->orderBy('hora_inicio')
            ->get();

        // Agregar info de disponibilidad y si ya tiene reserva
        $horarios = $horarios->map(function ($horario) use ($user, $fecha) {
            $reservaExistente = AsistenciaClase::where('horario_clase_id', $horario->id)
                ->where('entrenado_id', $user->id)
                ->where('fecha', $fecha)
                ->whereIn('estado', ['reservado', 'presente'])
                ->first();

            return [
                'id' => $horario->id,
                'clase' => $horario->clase,
                'instructor' => $horario->instructor,
                'hora_inicio' => $horario->hora_inicio,
                'hora_fin' => $horario->hora_fin,
                'lugares_disponibles' => $horario->lugaresDisponibles($fecha),
                'ya_reservado' => $reservaExistente !== null,
                'reserva_id' => $reservaExistente?->id,
            ];
        });

        return response()->json(['data' => $horarios]);
    }
}
