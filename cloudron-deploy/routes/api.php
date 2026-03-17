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
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Rutas públicas
Route::prefix('setup')->group(function () {
    Route::get('/status', [SetupController::class, 'status']);
    Route::post('/', [SetupController::class, 'setup']);
});

// Autenticación
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/otp/request', [AuthController::class, 'requestOtp']);
    Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
});

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Configuración del gimnasio (solo admin)
    Route::middleware('role:admin')->group(function () {
        Route::get('/config', [ConfigController::class, 'show']);
        Route::put('/config', [ConfigController::class, 'update']);
        Route::post('/config/logo', [ConfigController::class, 'updateLogo']);
    });

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

    // Planificación - Macrociclos
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::get('/entrenados/{entrenado}/macrociclos', [MacrocicloController::class, 'index']);
        Route::post('/entrenados/{entrenado}/macrociclos', [MacrocicloController::class, 'store']);
        Route::get('/macrociclos/{macrociclo}', [MacrocicloController::class, 'show']);
        Route::put('/macrociclos/{macrociclo}', [MacrocicloController::class, 'update']);
        Route::delete('/macrociclos/{macrociclo}', [MacrocicloController::class, 'destroy']);
        Route::post('/macrociclos/{macrociclo}/activar', [MacrocicloController::class, 'activar']);
        Route::post('/macrociclos/{macrociclo}/duplicar', [MacrocicloController::class, 'duplicar']);
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

        // Planes de cuota
        Route::apiResource('planes-cuota', CuotaController::class . '@planes');
        Route::get('/planes-cuota', [CuotaController::class, 'indexPlanes']);
        Route::post('/planes-cuota', [CuotaController::class, 'storePlan']);
        Route::put('/planes-cuota/{plan}', [CuotaController::class, 'updatePlan']);
        Route::delete('/planes-cuota/{plan}', [CuotaController::class, 'destroyPlan']);
    });

    // Evaluaciones
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::get('/entrenados/{entrenado}/evaluaciones', [EvaluacionController::class, 'index']);
        Route::post('/entrenados/{entrenado}/evaluaciones', [EvaluacionController::class, 'store']);
        Route::get('/evaluaciones/{evaluacion}', [EvaluacionController::class, 'show']);
        Route::put('/evaluaciones/{evaluacion}', [EvaluacionController::class, 'update']);
        Route::delete('/evaluaciones/{evaluacion}', [EvaluacionController::class, 'destroy']);
    });

    // Feedback (entrenadores crean, entrenados pueden ver los suyos)
    Route::get('/entrenados/{entrenado}/feedbacks', [FeedbackController::class, 'index']);
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::post('/entrenados/{entrenado}/feedbacks', [FeedbackController::class, 'store']);
        Route::put('/feedbacks/{feedback}', [FeedbackController::class, 'update']);
        Route::delete('/feedbacks/{feedback}', [FeedbackController::class, 'destroy']);
    });

    // Links adjuntos
    Route::get('/entrenados/{entrenado}/links', [LinkAdjuntoController::class, 'index']);
    Route::middleware('role:admin,entrenador')->group(function () {
        Route::post('/entrenados/{entrenado}/links', [LinkAdjuntoController::class, 'store']);
        Route::put('/links/{link}', [LinkAdjuntoController::class, 'update']);
        Route::delete('/links/{link}', [LinkAdjuntoController::class, 'destroy']);
    });

    // =====================================================
    // RUTAS PARA ENTRENADOS (su propia información)
    // =====================================================
    Route::middleware('role:entrenado')->prefix('mi')->group(function () {
        // Mi perfil
        Route::get('/perfil', [EntrenadoController::class, 'miPerfil']);
        Route::put('/perfil', [EntrenadoController::class, 'actualizarMiPerfil']);

        // Mi anamnesis
        Route::get('/anamnesis', [AnamnesisController::class, 'miAnamnesis']);

        // Mi plan activo
        Route::get('/plan', [MacrocicloController::class, 'miPlanActivo']);
        Route::get('/plan/sesion-hoy', [SesionController::class, 'miSesionHoy']);

        // Registrar desempeño de sesión
        Route::post('/sesiones/{sesion}/iniciar', [SesionController::class, 'iniciarSesion']);
        Route::post('/sesiones/{sesion}/finalizar', [SesionController::class, 'finalizarSesion']);
        Route::post('/sesiones/{sesion}/ejercicios/{ejercicio}/registrar', [SesionController::class, 'registrarEjercicio']);

        // Mis cuotas
        Route::get('/cuotas', [CuotaController::class, 'misCuotas']);

        // Mis evaluaciones
        Route::get('/evaluaciones', [EvaluacionController::class, 'misEvaluaciones']);

        // Mis feedbacks
        Route::get('/feedbacks', [FeedbackController::class, 'misFeedbacks']);

        // Mis links
        Route::get('/links', [LinkAdjuntoController::class, 'misLinks']);
    });
});
