<?php

namespace Database\Seeders;

use App\Models\Logro;
use Illuminate\Database\Seeder;

class LogrosSeeder extends Seeder
{
    public function run(): void
    {
        $logros = [
            // Rachas
            [
                'codigo' => 'streak_3',
                'nombre' => '3 días seguidos',
                'descripcion' => 'Entrenaste 3 días consecutivos',
                'icono' => 'fire',
                'color' => '#f97316',
                'categoria' => 'streak',
                'valor_requerido' => 3,
                'orden' => 1,
            ],
            [
                'codigo' => 'streak_7',
                'nombre' => 'Semana perfecta',
                'descripcion' => 'Entrenaste 7 días consecutivos',
                'icono' => 'fire',
                'color' => '#ef4444',
                'categoria' => 'streak',
                'valor_requerido' => 7,
                'orden' => 2,
            ],
            [
                'codigo' => 'streak_14',
                'nombre' => 'Dos semanas imparable',
                'descripcion' => 'Entrenaste 14 días consecutivos',
                'icono' => 'fire',
                'color' => '#dc2626',
                'categoria' => 'streak',
                'valor_requerido' => 14,
                'orden' => 3,
            ],
            [
                'codigo' => 'streak_30',
                'nombre' => 'Mes de hierro',
                'descripcion' => 'Entrenaste 30 días consecutivos',
                'icono' => 'fire',
                'color' => '#b91c1c',
                'categoria' => 'streak',
                'valor_requerido' => 30,
                'orden' => 4,
            ],
            [
                'codigo' => 'streak_100',
                'nombre' => 'Centurión',
                'descripcion' => 'Entrenaste 100 días consecutivos',
                'icono' => 'crown',
                'color' => '#7c2d12',
                'categoria' => 'streak',
                'valor_requerido' => 100,
                'orden' => 5,
            ],

            // Entrenamientos totales
            [
                'codigo' => 'workout_1',
                'nombre' => 'Primer paso',
                'descripcion' => 'Completaste tu primer entrenamiento',
                'icono' => 'star',
                'color' => '#22c55e',
                'categoria' => 'workout',
                'valor_requerido' => 1,
                'orden' => 10,
            ],
            [
                'codigo' => 'workout_10',
                'nombre' => 'En camino',
                'descripcion' => 'Completaste 10 entrenamientos',
                'icono' => 'star',
                'color' => '#16a34a',
                'categoria' => 'workout',
                'valor_requerido' => 10,
                'orden' => 11,
            ],
            [
                'codigo' => 'workout_25',
                'nombre' => 'Dedicado',
                'descripcion' => 'Completaste 25 entrenamientos',
                'icono' => 'medal',
                'color' => '#15803d',
                'categoria' => 'workout',
                'valor_requerido' => 25,
                'orden' => 12,
            ],
            [
                'codigo' => 'workout_50',
                'nombre' => 'Medio centenar',
                'descripcion' => 'Completaste 50 entrenamientos',
                'icono' => 'medal',
                'color' => '#166534',
                'categoria' => 'workout',
                'valor_requerido' => 50,
                'orden' => 13,
            ],
            [
                'codigo' => 'workout_100',
                'nombre' => 'Club de los 100',
                'descripcion' => 'Completaste 100 entrenamientos',
                'icono' => 'trophy',
                'color' => '#14532d',
                'categoria' => 'workout',
                'valor_requerido' => 100,
                'orden' => 14,
            ],
            [
                'codigo' => 'workout_250',
                'nombre' => 'Atleta veterano',
                'descripcion' => 'Completaste 250 entrenamientos',
                'icono' => 'trophy',
                'color' => '#f59e0b',
                'categoria' => 'workout',
                'valor_requerido' => 250,
                'orden' => 15,
            ],

            // Consistencia semanal
            [
                'codigo' => 'week_3',
                'nombre' => 'Semana activa',
                'descripcion' => 'Entrenaste 3 veces en una semana',
                'icono' => 'lightning',
                'color' => '#3b82f6',
                'categoria' => 'consistency',
                'valor_requerido' => 3,
                'orden' => 20,
            ],
            [
                'codigo' => 'week_5',
                'nombre' => 'Semana intensa',
                'descripcion' => 'Entrenaste 5 veces en una semana',
                'icono' => 'lightning',
                'color' => '#2563eb',
                'categoria' => 'consistency',
                'valor_requerido' => 5,
                'orden' => 21,
            ],
            [
                'codigo' => 'week_6',
                'nombre' => 'Bestia de la semana',
                'descripcion' => 'Entrenaste 6 veces en una semana',
                'icono' => 'muscle',
                'color' => '#1d4ed8',
                'categoria' => 'consistency',
                'valor_requerido' => 6,
                'orden' => 22,
            ],

            // Especiales
            [
                'codigo' => 'early_bird',
                'nombre' => 'Madrugador',
                'descripcion' => 'Entrenaste antes de las 7 AM',
                'icono' => 'rocket',
                'color' => '#8b5cf6',
                'categoria' => 'special',
                'valor_requerido' => null,
                'orden' => 30,
            ],
            [
                'codigo' => 'night_owl',
                'nombre' => 'Búho nocturno',
                'descripcion' => 'Entrenaste después de las 10 PM',
                'icono' => 'star',
                'color' => '#6366f1',
                'categoria' => 'special',
                'valor_requerido' => null,
                'orden' => 31,
            ],
            [
                'codigo' => 'weekend_warrior',
                'nombre' => 'Guerrero de fin de semana',
                'descripcion' => 'Entrenaste sábado y domingo',
                'icono' => 'target',
                'color' => '#ec4899',
                'categoria' => 'special',
                'valor_requerido' => null,
                'orden' => 32,
            ],
        ];

        foreach ($logros as $logro) {
            Logro::updateOrCreate(
                ['codigo' => $logro['codigo']],
                $logro
            );
        }
    }
}
