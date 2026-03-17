<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SetupController;
use App\Http\Controllers\Api\ConfigController;
use App\Http\Controllers\Api\EntrenadorController;
use App\Http\Controllers\Api\EntrenadoController;
use App\Http\Controllers\Api\EjercicioController;
use App\Http\Controllers\Api\AnamnesisController;
use App\Http\Controllers\Api\MacrocicloController;
use App\Http\Controllers\Api\MesocicloController;
use App\Http\Controllers\Api\MicrocicloController;
use App\Http\Controllers\Api\SesionController;
use App\Http\Controllers\Api\CuotaController;
use App\Http\Controllers\Api\EvaluacionController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\LinkAdjuntoController;
use App\Http\Controllers\Api\NegocioController;
use App\Http\Controllers\Api\CuponController;
use App\Http\Controllers\Api\CalendarioController;
use App\Http\Controllers\Api\LogroController;
use App\Http\Controllers\Api\PlantillaController;
use App\Http\Controllers\Api\ClaseController;
use App\Http\Controllers\Api\SucursalController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProgresionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check para Cloudron
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString()
    ]);
});

// Rutas públicas
Route::prefix('setup')->group(function () {
    Route::get('/status', [SetupController::class, 'status']);
    Route::post('/', [SetupController::class, 'setup']);
});

// Config pública (para branding en login page)
Route::get('/config', [ConfigController::class, 'showPublic']);

// Calendario público (para mostrar en la página principal)
Route::get('/calendario/hoy', [CalendarioController::class, 'estadoHoy']);
Route::get('/calendario/mes', [CalendarioController::class, 'calendarioMes']);

// Check-in público (solo por DNI)
Route::post('/checkin-publico/buscar', [EntrenadoController::class, 'buscarPorDni']);
Route::post('/checkin-publico/{entrenado}/registrar', [EntrenadoController::class, 'registrarIngresoPublico']);

// Autenticación
Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/login-entrenado', [AuthController::class, 'loginEntrenado']);
    Route::post('/otp/request', [AuthController::class, 'requestOtp']);
    Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
});

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Configuración del gimnasio (solo admin puede modificar)
    Route::middleware('role:admin')->group(function () {
        Route::get('/config/full', [ConfigController::class, 'show']); // Config completa para admin
        Route::put('/config', [ConfigController::class, 'update']);
        Route::post('/config/logo', [ConfigController::class, 'updateLogo']);
        Route::post('/config/test-email', [ConfigController::class, 'testEmail']);
        // Super Admin - Configuración SMTP
        Route::post('/config/super-admin/verify', [ConfigController::class, 'verifySuperAdmin']);
        Route::post('/config/super-admin/smtp', [ConfigController::class, 'getSmtpConfig']);
        Route::put('/config/super-admin/smtp', [ConfigController::class, 'updateSmtpConfig']);

        // Auditoría
        Route::get('/audit', [AuditController::class, 'index']);
        Route::get('/audit/user/{userId}', [AuditController::class, 'byUser']);
        Route::get('/audit/entity/{type}/{id}', [AuditController::class, 'byEntity']);

        // Sucursales (multi-sede)
        Route::apiResource('sucursales', SucursalController::class);
        Route::get('/sucursales/{sucursal}/usuarios', [SucursalController::class, 'usuarios']);
        Route::post('/sucursales/{sucursal}/usuarios', [SucursalController::class, 'agregarUsuario']);
        Route::delete('/sucursales/{sucursal}/usuarios', [SucursalController::class, 'quitarUsuario']);
    });

    // Sucursales activas (para selectores - disponible para todos los autenticados)
    Route::get('/sucursales-activas', [SucursalController::class, 'activas']);

    // Entrenadores (solo admin)
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('entrenadores', EntrenadorController::class);
    });

    // Entrenados (entrenadores y admin)
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::apiResource('entrenados', EntrenadoController::class);
        Route::post('/entrenados/{entrenado}/baja-temporal', [EntrenadoController::class, 'bajaTemporal']);
        Route::post('/entrenados/{entrenado}/reactivar', [EntrenadoController::class, 'reactivar']);
        Route::post('/entrenados/{entrenado}/asignar-entrenador', [EntrenadoController::class, 'asignarEntrenador']);
        Route::post('/entrenados/{entrenado}/foto', [EntrenadoController::class, 'uploadFoto']);

        // Check-in de entrenados
        Route::post('/checkin/buscar', [EntrenadoController::class, 'buscarParaCheckin']);
        Route::post('/checkin/{entrenado}/registrar', [EntrenadoController::class, 'registrarIngreso']);

        // Dashboard del entrenador
        Route::get('/dashboard/entrenador', [DashboardController::class, 'entrenador']);
        Route::get('/dashboard/actividad-reciente', [DashboardController::class, 'actividadReciente']);
        Route::get('/dashboard/alertas', [DashboardController::class, 'alertas']);
    });

    // Ejercicios (entrenadores y admin pueden crear/editar, todos pueden ver)
    Route::get('/ejercicios', [EjercicioController::class, 'index']);
    Route::get('/ejercicios/{ejercicio}', [EjercicioController::class, 'show']);
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::post('/ejercicios', [EjercicioController::class, 'store']);
        Route::put('/ejercicios/{ejercicio}', [EjercicioController::class, 'update']);
        Route::delete('/ejercicios/{ejercicio}', [EjercicioController::class, 'destroy']);
    });

    // Anamnesis
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::get('/entrenados/{entrenado}/anamnesis', [AnamnesisController::class, 'show']);
        Route::post('/entrenados/{entrenado}/anamnesis', [AnamnesisController::class, 'store']);
        Route::put('/entrenados/{entrenado}/anamnesis', [AnamnesisController::class, 'update']);
    });

    // Planificación - Macrociclos (alias: /planes = /macrociclos)
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::get('/macrociclos', [MacrocicloController::class, 'indexAll']); // Listar todos los planes
        Route::get('/planes', [MacrocicloController::class, 'indexAll']); // Alias
        Route::get('/entrenados/{entrenado}/macrociclos', [MacrocicloController::class, 'index']);
        Route::post('/entrenados/{entrenado}/macrociclos', [MacrocicloController::class, 'store']);
        Route::get('/macrociclos/{macrociclo}', [MacrocicloController::class, 'show']);
        Route::get('/planes/{macrociclo}', [MacrocicloController::class, 'show']); // Alias
        Route::put('/macrociclos/{macrociclo}', [MacrocicloController::class, 'update']);
        Route::put('/planes/{macrociclo}', [MacrocicloController::class, 'update']); // Alias
        Route::delete('/macrociclos/{macrociclo}', [MacrocicloController::class, 'destroy']);
        Route::post('/macrociclos/{macrociclo}/activar', [MacrocicloController::class, 'activar']);
        Route::post('/macrociclos/{macrociclo}/duplicar', [MacrocicloController::class, 'duplicar']);

        // Plantillas de planes
        Route::get('/plantillas', [PlantillaController::class, 'index']);
        Route::post('/plantillas', [PlantillaController::class, 'store']);
        Route::get('/plantillas/{plantilla}', [PlantillaController::class, 'show']);
        Route::put('/plantillas/{plantilla}', [PlantillaController::class, 'update']);
        Route::delete('/plantillas/{plantilla}', [PlantillaController::class, 'destroy']);
        Route::post('/plantillas/{plantilla}/aplicar/{entrenado}', [PlantillaController::class, 'aplicar']);
    });

    // Mesociclos
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::get('/macrociclos/{macrociclo}/mesociclos', [MesocicloController::class, 'index']);
        Route::post('/macrociclos/{macrociclo}/mesociclos', [MesocicloController::class, 'store']);
        Route::get('/mesociclos/{mesociclo}', [MesocicloController::class, 'show']);
        Route::put('/mesociclos/{mesociclo}', [MesocicloController::class, 'update']);
        Route::delete('/mesociclos/{mesociclo}', [MesocicloController::class, 'destroy']);
        Route::post('/mesociclos/{mesociclo}/desbloquear', [MesocicloController::class, 'desbloquear']);
    });

    // Microciclos
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::get('/mesociclos/{mesociclo}/microciclos', [MicrocicloController::class, 'index']);
        Route::post('/mesociclos/{mesociclo}/microciclos', [MicrocicloController::class, 'store']);
        Route::get('/microciclos/{microciclo}', [MicrocicloController::class, 'show']);
        Route::put('/microciclos/{microciclo}', [MicrocicloController::class, 'update']);
        Route::delete('/microciclos/{microciclo}', [MicrocicloController::class, 'destroy']);
    });

    // Sesiones
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::get('/microciclos/{microciclo}/sesiones', [SesionController::class, 'index']);
        Route::post('/microciclos/{microciclo}/sesiones', [SesionController::class, 'store']);
        Route::get('/sesiones/{sesion}', [SesionController::class, 'show']);
        Route::put('/sesiones/{sesion}', [SesionController::class, 'update']);
        Route::delete('/sesiones/{sesion}', [SesionController::class, 'destroy']);
        Route::post('/sesiones/{sesion}/ejercicios', [SesionController::class, 'agregarEjercicio']);
        Route::put('/sesiones/{sesion}/ejercicios/{ejercicio}', [SesionController::class, 'actualizarEjercicio']);
        Route::delete('/sesiones/{sesion}/ejercicios/{ejercicio}', [SesionController::class, 'eliminarEjercicio']);
        Route::post('/sesiones/{sesion}/ejercicios/reordenar', [SesionController::class, 'reordenarEjercicios']);
    });

    // Cuotas y pagos (admin y entrenador)
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::get('/entrenados/{entrenado}/cuotas', [CuotaController::class, 'index']);
        Route::post('/entrenados/{entrenado}/cuotas', [CuotaController::class, 'store']);
        Route::get('/cuotas/{cuota}', [CuotaController::class, 'show']);
        Route::put('/cuotas/{cuota}', [CuotaController::class, 'update']);
        Route::delete('/cuotas/{cuota}', [CuotaController::class, 'destroy']);
        Route::post('/cuotas/{cuota}/pago', [CuotaController::class, 'registrarPago']);
        Route::get('/cuotas', [CuotaController::class, 'indexAll']);
        Route::get('/cuotas/{cuota}/pagos', [CuotaController::class, 'pagos']);

        // Planes de cuota
        Route::get('/planes-cuota', [CuotaController::class, 'indexPlanes']);
        Route::post('/planes-cuota', [CuotaController::class, 'storePlan']);
        Route::put('/planes-cuota/{plan}', [CuotaController::class, 'updatePlan']);
        Route::delete('/planes-cuota/{plan}', [CuotaController::class, 'destroyPlan']);
    });

    // Evaluaciones
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::get('/evaluaciones', [EvaluacionController::class, 'all']);
        Route::get('/entrenados/{entrenado}/evaluaciones', [EvaluacionController::class, 'index']);
        Route::post('/entrenados/{entrenado}/evaluaciones', [EvaluacionController::class, 'store']);
        Route::get('/evaluaciones/{evaluacion}', [EvaluacionController::class, 'show']);
        Route::put('/evaluaciones/{evaluacion}', [EvaluacionController::class, 'update']);
        Route::delete('/evaluaciones/{evaluacion}', [EvaluacionController::class, 'destroy']);
    });

    // Estadísticas de entrenado (para entrenadores)
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::get('/entrenados/{entrenado}/estadisticas', [LogroController::class, 'estadisticasEntrenado']);
    });

    // Feedback (entrenadores crean, entrenados pueden ver los suyos)
    Route::get('/entrenados/{entrenado}/feedbacks', [FeedbackController::class, 'index']);
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::get('/feedbacks', [FeedbackController::class, 'indexAll']); // Listar todos los feedbacks
        Route::post('/entrenados/{entrenado}/feedbacks', [FeedbackController::class, 'store']);
        Route::put('/feedbacks/{feedback}', [FeedbackController::class, 'update']);
        Route::delete('/feedbacks/{feedback}', [FeedbackController::class, 'destroy']);
    });

    // Links adjuntos
    Route::get('/entrenados/{entrenado}/links', [LinkAdjuntoController::class, 'index']);
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::get('/links', [LinkAdjuntoController::class, 'all']);
        Route::post('/entrenados/{entrenado}/links', [LinkAdjuntoController::class, 'store']);
        Route::put('/links/{link}', [LinkAdjuntoController::class, 'update']);
        Route::delete('/links/{link}', [LinkAdjuntoController::class, 'destroy']);
    });

    // =====================================================
    // NEGOCIOS Y CUPONES (admin y entrenador)
    // =====================================================
    Route::middleware('role:admin,entrenador')->group(function () {
        // Negocios (empresas que ofrecen cupones)
        Route::apiResource('negocios', NegocioController::class);
        Route::post('/negocios/{negocio}/logo', [NegocioController::class, 'uploadLogo']);

        // Cupones
        Route::apiResource('cupones', CuponController::class);
        Route::post('/cupones/{cupon}/asignar', [CuponController::class, 'asignar']);
        Route::post('/cupones/{cupon}/asignar-todos', [CuponController::class, 'asignarATodos']);
        Route::post('/cupones-entrenado/{cuponEntrenado}/canjear', [CuponController::class, 'canjear']);

        // Calendario del gimnasio
        Route::get('/calendario/horarios', [CalendarioController::class, 'horarios']);
        Route::put('/calendario/horarios', [CalendarioController::class, 'updateHorarios']);
        Route::get('/calendario/dias-especiales', [CalendarioController::class, 'diasEspeciales']);
        Route::post('/calendario/dias-especiales', [CalendarioController::class, 'storeDiaEspecial']);
        Route::put('/calendario/dias-especiales/{diaEspecial}', [CalendarioController::class, 'updateDiaEspecial']);
        Route::delete('/calendario/dias-especiales/{diaEspecial}', [CalendarioController::class, 'destroyDiaEspecial']);

        // =====================================================
        // CLASES GRUPALES
        // =====================================================
        // CRUD de tipos de clases
        Route::apiResource('clases', ClaseController::class);

        // Horarios de clases
        Route::get('/clases/{clase}/horarios', [ClaseController::class, 'horarios']);
        Route::post('/clases/{clase}/horarios', [ClaseController::class, 'storeHorario']);
        Route::put('/horarios-clase/{horario}', [ClaseController::class, 'updateHorario']);
        Route::delete('/horarios-clase/{horario}', [ClaseController::class, 'destroyHorario']);

        // Calendario de clases (vista semanal)
        Route::get('/clases-calendario/semana', [ClaseController::class, 'calendarioSemana']);

        // Reservas y asistencias (para entrenadores)
        Route::post('/horarios-clase/{horario}/reservar', [ClaseController::class, 'reservar']);
        Route::get('/horarios-clase/{horario}/asistentes', [ClaseController::class, 'asistentes']);
        Route::post('/asistencias-clase/{asistencia}/checkin', [ClaseController::class, 'checkinClase']);
        Route::post('/asistencias-clase/{asistencia}/cancelar', [ClaseController::class, 'cancelarReserva']);
    });

    // =====================================================
    // RUTAS PARA ENTRENADOS (su propia información)
    // =====================================================
    Route::middleware('role:entrenado')->prefix('mi')->group(function () {
        // Mi perfil
        Route::get('/perfil', [EntrenadoController::class, 'miPerfil']);
        Route::put('/perfil', [EntrenadoController::class, 'actualizarMiPerfil']);
        Route::post('/foto', [EntrenadoController::class, 'uploadMiFoto']);

        // Mi anamnesis
        Route::get('/anamnesis', [AnamnesisController::class, 'miAnamnesis']);

        // Mi plan activo
        Route::get('/plan', [MacrocicloController::class, 'miPlanActivo']);
        Route::get('/plan/sesion-hoy', [SesionController::class, 'miSesionHoy']);

        // Registrar desempeño de sesión
        Route::post('/sesiones/{sesion}/iniciar', [SesionController::class, 'iniciarSesion']);
        Route::post('/sesiones/{sesion}/finalizar', [SesionController::class, 'finalizarSesion']);
        Route::post('/sesiones/{sesion}/ejercicios/{ejercicio}/registrar', [SesionController::class, 'registrarEjercicio']);
        Route::post('/sesiones/{sesion}/registrar', [SesionController::class, 'registrarSesionCompleta']);

        // Ver sesión específica
        Route::get('/sesiones/{sesion}', [SesionController::class, 'showForEntrenado']);

        // Historial de sesiones de entrenamiento
        Route::get('/historial', [SesionController::class, 'miHistorial']);

        // Progresión y estadísticas de rendimiento
        Route::get('/progresion/ejercicios', [ProgresionController::class, 'ejercicios']);
        Route::get('/progresion/tonelaje', [ProgresionController::class, 'tonelaje']);
        Route::get('/progresion/distribucion', [ProgresionController::class, 'distribucion']);

        // Mis cuotas
        Route::get('/cuotas', [CuotaController::class, 'misCuotas']);

        // Mis evaluaciones
        Route::get('/evaluaciones', [EvaluacionController::class, 'misEvaluaciones']);

        // Mis feedbacks
        Route::get('/feedbacks', [FeedbackController::class, 'misFeedbacks']);

        // Mis links
        Route::get('/links', [LinkAdjuntoController::class, 'misLinks']);

        // Mis cupones
        Route::get('/cupones', [CuponController::class, 'misCupones']);
        Route::post('/cupones/{cuponEntrenado}/canjear', [CuponController::class, 'canjear']);

        // Estadísticas, rachas y logros
        Route::get('/estadisticas', [LogroController::class, 'misEstadisticas']);
        Route::post('/verificar-logros', [LogroController::class, 'verificarLogros']);
        Route::post('/logros/marcar-vistos', [LogroController::class, 'marcarVistos']);
        Route::get('/logros/nuevos', [LogroController::class, 'logrosNuevos']);

        // Mis clases grupales
        Route::get('/clases/disponibles', [ClaseController::class, 'clasesDisponibles']);
        Route::get('/clases/reservas', [ClaseController::class, 'misReservas']);
        Route::get('/clases/historial', [ClaseController::class, 'miHistorialClases']);
        Route::post('/clases/{horario}/reservar', [ClaseController::class, 'reservar']);
        Route::post('/clases/reservas/{asistencia}/cancelar', [ClaseController::class, 'cancelarReserva']);
    });
});
