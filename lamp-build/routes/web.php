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

// Ruta catch-all para servir el SPA de React
Route::get('/{any?}', function () {
    // En producción, servir el index.html del frontend compilado
    $indexPath = public_path('app.html');

    if (File::exists($indexPath)) {
        return File::get($indexPath);
    }

    // En desarrollo, mostrar mensaje
    return response()->json([
        'message' => 'Pwr360 API',
        'version' => '1.0.0',
        'docs' => 'El frontend debe compilarse y copiarse a public/',
    ]);
})->where('any', '^(?!api).*$');
