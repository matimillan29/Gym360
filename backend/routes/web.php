<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| En producción, todas las rutas web sirven el SPA de React.
| La API está en routes/api.php con prefijo /api
|
*/

// Health check endpoint (for Cloudron monitoring)
Route::get('/health', function () {
    return response('OK', 200);
});

// Ruta catch-all para servir el SPA de React
Route::get('/{any?}', function () {
    // En producción, servir el index.html del frontend compilado
    $indexPath = public_path('app.html');

    if (File::exists($indexPath)) {
        return response(File::get($indexPath), 200)
            ->header('Content-Type', 'text/html');
    }

    // Fallback: try index.html
    $indexPath2 = public_path('index.html');
    if (File::exists($indexPath2)) {
        return response(File::get($indexPath2), 200)
            ->header('Content-Type', 'text/html');
    }

    // En desarrollo, mostrar mensaje
    return response()->json([
        'message' => 'Pwr360 API',
        'version' => '1.0.0',
        'status' => 'ok',
    ]);
})->where('any', '^(?!api|health).*$');
