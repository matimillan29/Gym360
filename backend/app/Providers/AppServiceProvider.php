<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Route model binding para entrenadores (usa modelo User)
        Route::bind('entrenador', function ($value) {
            return User::whereIn('role', ['admin', 'entrenador'])->findOrFail($value);
        });

        // Route model binding para entrenados (usa modelo User)
        Route::bind('entrenado', function ($value) {
            return User::where('role', 'entrenado')->findOrFail($value);
        });
    }
}
