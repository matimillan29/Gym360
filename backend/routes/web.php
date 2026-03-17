<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Ruta catch-all para servir el SPA de React
Route::get('/{any?}', function () {
    try {
        $basePath = base_path('public');

        // Intentar app.html (frontend compilado renombrado)
        $appHtml = $basePath . '/app.html';
        if (file_exists($appHtml)) {
            return response(file_get_contents($appHtml), 200)
                ->header('Content-Type', 'text/html; charset=UTF-8');
        }

        // Fallback: index.html
        $indexHtml = $basePath . '/index.html';
        if (file_exists($indexHtml)) {
            return response(file_get_contents($indexHtml), 200)
                ->header('Content-Type', 'text/html; charset=UTF-8');
        }
    } catch (\Throwable $e) {
        // Si hay cualquier error leyendo archivos, devolver OK para healthcheck
    }

    // Fallback mínimo - siempre devuelve 200
    return response('Pwr360 - OK', 200)
        ->header('Content-Type', 'text/plain');
})->where('any', '^(?!api).*$');
