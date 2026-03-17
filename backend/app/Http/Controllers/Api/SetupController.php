<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\GymConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SetupController extends Controller
{
    /**
     * Verificar estado de instalación
     */
    public function status()
    {
        $isConfigured = GymConfig::isConfigured();
        $hasAdmin = User::where('role', 'admin')->exists();

        return response()->json([
            'is_configured' => $isConfigured && $hasAdmin,
            'has_admin' => $hasAdmin,
        ]);
    }

    /**
     * Configuración inicial del sistema
     */
    public function setup(Request $request)
    {
        // Verificar que no esté ya configurado
        if (GymConfig::isConfigured() && User::where('role', 'admin')->exists()) {
            return response()->json([
                'message' => 'El sistema ya está configurado.',
            ], 400);
        }

        $request->validate([
            'gym_nombre' => 'required|string|max:255',
            'gym_logo' => 'nullable|image|max:2048',
            'gym_color' => 'nullable|string|max:7',
            'admin_nombre' => 'required|string|max:255',
            'admin_apellido' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8|confirmed',
        ]);

        DB::beginTransaction();

        try {
            // Guardar logo si se subió
            $logoPath = null;
            if ($request->hasFile('gym_logo')) {
                $logoPath = $request->file('gym_logo')->store('gym', 'public');
            }

            // Crear configuración del gym
            $gymConfig = GymConfig::create([
                'nombre' => $request->gym_nombre,
                'logo' => $logoPath ? Storage::url($logoPath) : null,
                'color_principal' => $request->gym_color ?? '#3b82f6',
                'color_secundario' => '#64748b',
            ]);

            // Crear usuario admin
            $admin = User::create([
                'email' => $request->admin_email,
                'password' => $request->admin_password,
                'nombre' => $request->admin_nombre,
                'apellido' => $request->admin_apellido,
                'estado' => 'activo',
            ]);
            $admin->role = 'admin';
            $admin->save();

            DB::commit();

            return response()->json([
                'message' => 'Sistema configurado correctamente.',
                'gym' => $gymConfig,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Error al configurar el sistema.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
